function setup() {
	// default is 60 fps
	frameRate(60);
	canvas = createCanvas(700, 500);
	// set origin to center of canvas
	canvas.translate(width/2, height/2);

	cartesian = new Coordinate('cartesian');
	polar = new Coordinate('polar');
	parabolic = new Coordinate('parabolic');
	
	// NEAT THING //
	var uFuncNeat = (x, y) => .9*(x*y/250 + 10*cos(x/2)*sin(x/2));
	var vFuncNeat = (x, y) => .9*(-.004*sq(x) + 2*cos(y)) + height/2.2;
	var xParamNeat = new CoordinateParameter(50, -width/2, width/2, -width/2, width/2);
	var yParamNeat = new CoordinateParameter(50, -height/2, height/2, 10, height/1.8);
	neat = new Coordinate(uFuncNeat, vFuncNeat, xParamNeat, yParamNeat);
	
	// noLoop();
}


var dt = .1;
var t = 0;
var tStep = 20;

function draw() {
	background(230);
	
	// axes
	push();
	stroke(255,0,0,120);
	strokeWeight(4);
	line(-width/2, 0, width/2, 0);
	line(0, -height/2, 0, height/2);
	pop();
	
	
	if (t >= 0 && t < tStep) {
		parabolic.render();
	} else if (t >= tStep && t < 2*tStep) {
		polar.render();
	} else if (t >= 2*tStep && t < 3*tStep) {
		cartesian.render();
	} else if (t >= 3*tStep && t < 4*tStep) {
		neat.render();
	} else {
		t = 0;
	}
	
	t += dt;
}

// arguments: (arr: array of vectors, showVertices: bool - should vertices be displayed?)
var addCurve = function(arr, showVertices) {

	noFill();
	beginShape();
	
	// control points included as curve vertices
	for (var i = 0; i < arr.length; i++) {
		curveVertex(arr[i].x, arr[i].y);
		
		if (showVertices == true) {
			// add circles marking points for testing
			push();
			// make control points red
			if (i == 0 || i == arr.length-1) {
				fill(255,0,0);
			}
			if (i != 0 && i != arr.length-1){
				ellipse(arr[i].x,arr[i].y,10,10);
			}
			pop();
		}
	}
	
	endShape();
}

// arguments: (required: numSteps, required: start, required: stop, required: newStart, required: newStop)
var CoordinateParameter = function(numSteps, start, stop, newStart, newStop) {
		
	// incremented value for coordinate line calculations, number of curves will be (numSteps+1)
	this.numSteps = numSteps;

	// original coordinate range, probably canvas side length
	this.start = start;
	this.stop = stop;

	// new coordinate range to map to, i.e. theta=[0,TWO_PI] in polar coordinates
	this.newStart = newStart;
	this.newStop = newStop;
	
}

CoordinateParameter.prototype.getStepSize = function() {
	return (this.stop - this.start)/this.numSteps;
}

// arguments (required: ufunction, required: vfunction, optional: CoordinateParameter - add any number parameters)
// OR pass in a string to get a default Coordinate. options: 'cartesian', 'polar', 'parabolic'
var Coordinate = function(uFunction, vFunction, parameter) {
	
	this.uFunc = uFunction;
	this.vFunc = vFunction;
	
	this.parameters = [];
	
	// any arguments after uFunction and vFunction added to array of CoordinateParameter objects
	for (var i = 2; i < arguments.length; i++) {
		this.parameters.push(arguments[i]);
	}
	
	if ( typeof(uFunction) === 'string' ) {
		var coordinateType = uFunction;
		this.setDefault(coordinateType);
	}
	
}

Coordinate.prototype.setDefault = function(coordinateType) {
	
	if (coordinateType == 'cartesian') {
		
		this.uFunc = (x, y) => x;
		this.vFunc = (x, y) => y;
		this.addParameter(40, -width/2, width/2, -width/2, width/2);
		this.addParameter(40, -height/2, height/2, -height/2, height/2);
		
	} else if (coordinateType == 'polar') {
		
		this.uFunc = (x, y) => x*cos(y);
		this.vFunc = (x, y) => x*sin(y);
		this.addParameter(10, -width/2, width/2, 0, height/2);
		this.addParameter(20, -height/2, height/2, 0, TWO_PI);
		
	} else if (coordinateType == 'parabolic') {
		
		this.uFunc = (x, y) => .0055*( x*y );
		this.vFunc = (x, y) => .0055*( (sq(y)-sq(x))/2 );
		this.addParameter(50, -width/2, width/2, -width/2, width/2);
		this.addParameter(50, -width/2, width/2, -width/2, width/2);
		
	}
}

// 1 argument: (required: CoordinateParameter object)
// OR 5 arguments: (required: numSteps, required: start, required: stop, required: newStart, required: newStop)
Coordinate.prototype.addParameter = function(numSteps, start, stop, newStart, newStop) {

	if (arguments.length == 1) {
		// if only one argument is given, it will be a CoordinateParameter object
		var newParam = arguments[0];
		
	} else {
		
		var newParam = new CoordinateParameter(numSteps, start, stop, newStart, newStop);
		
	}
	
	this.parameters.push(newParam);
	
	return newParam;
	
}

// possibly change to parameter method that adds properties to Parameter
// get increment, init, and condition values by passing through starting uFunc and vFunc to enable transformations from any starting coordinate system
var loopParam = function(parameter, paramOrder, loopOrder) {
	// are paramOrder and loopOrder properties needed??
	this.paramOrder = paramOrder;
	this.increment = parameter.getStepSize();
	this.init = parameter.start - this.increment;
	this.condition = parameter.stop + this.increment;
	// used as dummy variable in nested for loops
	this.var;
}

// arguments: (required: varyingParam, optional: constantParam - add any number parameters)
// pass in this.parmeters index values as arguments instead???
Coordinate.prototype.transform = function(varyingParam, constantParam) {

	// should these be somewhare else??? right now it's set to map everything to where it began
	// add rotation option
	// add 'normalize == true' scaling option to fit coordinates inside canvas
	var scale = 1;
	var translate = 0;  // only translates if all are the same, but possible to pin sides down
	this.uStart = scale*this.parameters[0].start + translate;
	this.uStop = scale*this.parameters[0].stop + translate;
	this.vStart = scale*this.parameters[1].start + translate;
	this.vStop = scale*this.parameters[1].stop + translate;
	
	
	this.varyingParam = varyingParam;
	// any arguments after constantParam added to array of CoordinateParameter objects
	this.constantParams = [];
	this.transformParams = [];
	for (var i = 1; i < arguments.length; i++) {
		
		this.constantParams.push(arguments[i]);
		
		this.transformParams.push(arguments[i]);
		if (i == arguments.length-1) {
			this.transformParams.push(varyingParam);
		}
	}
	
	var getCoordinate = function(loopParams) {
		
		var p = this.parameters;
		
		// sets range of new parameter values
		// use this same technique to start from arbitrary coordinate system (right now it's stepping through cartesian coordinates)
		var newX = map(loopParams[0].var, p[0].start, p[0].stop, p[0].newStart, p[0].newStop);
		var newY = map(loopParams[1].var, p[1].start, p[1].stop, p[1].newStart, p[1].newStop);
		
		var coordinate = createVector(this.uFunc(newX,newY), this.vFunc(newX,newY));
		
		// scales or translates entire uv-coordinate system
		coordinate.x = map(coordinate.x, p[0].start, p[0].stop, this.uStart, this.uStop);
		coordinate.y = map(coordinate.y, p[1].start, p[1].stop, this.vStart, this.vStop);

		return coordinate;
		
	}.bind(this);
	
	
	var curveArr = [];
	
	var loopParams = [];
	for (var i = 0; i < this.parameters.length; i++) {
		var paramOrder = i;
		loopParams.push(new loopParam(this.parameters[i], paramOrder));
	}
	
	var curveArr = [];
	var loop = function(i, curveArg) {
		// initialize i to 0 on first call
		if (!i) {
			i = 0;
		}
		var index = this.parameters.indexOf(this.transformParams[i]);
		var loopParam = loopParams[index];
		loopParam.var = loopParam.init;
		while (loopParam.var <= loopParam.condition) {
			
			// innermost loop
			if (i == this.transformParams.length-1) {
				curveArg.push(getCoordinate(loopParams));
			// second to last loop
			} else if (i == this.transformParams.length-2) {
				var curve = [];
				loop(i+1, curve);
				curveArr.push(curve);
			} else {
				loop(i+1);	
			}
			
			loopParam.var += loopParam.increment;
		}
	}.bind(this)

	loop();
	
	
	// let index = this.parameters.indexOf(this.constantParams[0]);
	// let ob = loopParams[index];
	// for (ob.var = ob.init; ob.var <= ob.condition; ob.var += ob.increment) {
	// 	var curve = [];
	// 	let index = this.parameters.indexOf(this.varyingParam);
	// 	let ob = loopParams[index];
	// 	for (ob.var = ob.init; ob.var <= ob.condition; ob.var += ob.increment) {
	// 		curve.push(getCoordinate(loopParams));	
	// 	}
	// 	curveArr.push(curve);
	// }
	
	//remove first and last curves, which are made up of control points and shouldn't be rendered
	curveArr.shift();
	curveArr.pop();
	
	return curveArr;
}

Coordinate.prototype.render = function(showVertices) {
	// x-curves: lines of constant y
	this.xCurves = this.transform(this.parameters[0], this.parameters[1]);
	// y-curves: lines of constant x
	this.yCurves = this.transform(this.parameters[1], this.parameters[0]);
	// example of 3D z-curve call
	// this.zCurves = this.transform(this.parameters[2], this.parameters[0], this.parameters[1]);

	for (var i = 0; i < this.xCurves.length; i++) {
		addCurve(this.xCurves[i], showVertices);
	}
	for (var i = 0; i < this.yCurves.length; i++) {
		addCurve(this.yCurves[i], showVertices);
	}
	
}
