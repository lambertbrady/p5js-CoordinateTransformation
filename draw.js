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
	
	noLoop();
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
	
	
// 	if (t >= 0 && t < tStep) {
// 		parabolic.render();
// 	} else if (t >= tStep && t < 2*tStep) {
		polar.render();
// 	} else if (t >= 2*tStep && t < 3*tStep) {
// 		cartesian.render();
// 	} else if (t >= 3*tStep && t < 4*tStep) {
// 		neat.render();
// 	} else {
// 		t = 0;
// 	}
	
// 	t += dt;
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
	this.curves = [];
	
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

Coordinate.prototype.getCoordinate = function() {
		
	var p = this.parameters;

	// sets range of new parameter values
	// use this same technique to start from arbitrary coordinate system (right now it's stepping through cartesian coordinates)
	var newX = map(p[0].var, p[0].start, p[0].stop, p[0].newStart, p[0].newStop);
	var newY = map(p[1].var, p[1].start, p[1].stop, p[1].newStart, p[1].newStop);

	var coordinate = createVector(this.uFunc(newX,newY), this.vFunc(newX,newY));

	// scales or translates entire uv-coordinate system
	coordinate.x = map(coordinate.x, p[0].start, p[0].stop, this.uStart, this.uStop);
	coordinate.y = map(coordinate.y, p[1].start, p[1].stop, this.vStart, this.vStop);

	return coordinate;
	
}

Coordinate.prototype.getCurves = function(i, recursiveCurve) {
	
	// initialize i to 0 on first call
	if (!i) { i = 0; }
	
	var curves = [];

	var transformParamIndex = this.parameters.indexOf(this.transformParams[i]);
	var param = this.parameters[transformParamIndex];
	
	var step = param.getStepSize();
	var condition = param.stop + step;
	param.var = param.start - step;
	
	// recursion loop acting as dynamically nested for loops, where number of for loops is determined by length of transformParams array (i.e., number of arguments passed into addCurveSet method)
	while (param.var <= condition) {

		// innermost loop
		if (i == this.transformParams.length-1) {
			recursiveCurve.push(this.getCoordinate());
		// second to last loop
		} else if (i == this.transformParams.length-2) {
			var curve = [];
			this.getCurves(i+1, curve);
			curves.push(curve);
		} else {
			this.getCurves(i+1);	
		}

		param.var += step;
	}
	
	//remove first and last curves, which are made up of control points and shouldn't be rendered
	curves.shift();
	curves.pop();
	
	return curves;
}


// var CurveSet = function() {
	
// }

// arguments: (required: varyingParam, optional: constantParam - add any number parameters)
// pass in this.parmeters index values as arguments instead???
Coordinate.prototype.addCurveSet = function(varyingParam, constantParam) {

	// should these be somewhare else??? right now it's set to map everything to where it began
	// add rotation, translate options
	// add 'normalize == true' scaling option to fit coordinates inside canvas
	var scale = [1, 1, 1, 1];
	var stretch = [0, 0, 0, 0];
	this.uStart = scale[0]*this.parameters[0].start + stretch[0];
	this.uStop = scale[1]*this.parameters[0].stop + stretch[1];
	this.vStart = scale[2]*this.parameters[1].start + stretch[2];
	this.vStop = scale[3]*this.parameters[1].stop + stretch[3];
	
	
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

	var curves = this.getCurves();
	
	this.curveSets.push(curves);
	return curves;
}

// arguments: (arr: array of vectors, showVertices: bool - should vertices be displayed?)
var drawCurve = function(curveCoordinates, showVertices) {

	noFill();
	beginShape();
	
	// control points included as curve vertices
	for (var i = 0; i < curveCoordinates.length; i++) {
		curveVertex(curveCoordinates[i].x, curveCoordinates[i].y);
		
		if (showVertices == true) {
			// add circles marking vertices
			push();
			// make control points red
			if (i == 0 || i == curveCoordinates.length-1) {
				fill(255,0,0);
			}
			if (i != 0 && i != curveCoordinates.length-1){
				ellipse(arr[i].x,curveCoordinates[i].y,10,10);
			}
			pop();
		}
	}
	
	endShape();
}

Coordinate.prototype.render = function(showVertices) {
	
	this.curveSets = [];
	
	// x-curves: lines of constant y
	this.addCurveSet(this.parameters[0], this.parameters[1]);
	// y-curves: lines of constant x
	this.addCurveSet(this.parameters[1], this.parameters[0]);
	// example of 3D z-curve call
	// this.addCurveSet(this.parameters[2], this.parameters[0], this.parameters[1]);

	// this.curves[i][j][k].x
	// this.curveSets[i] is an array of curve arrays, that represesents a set of x-curves, y-curves, etc. In other words, each object in the array is (probably) uniquely defined by the varying parameter used in the addCurveSet() method
	// this.curveSets[i][j] is an array of vectors that represents a single curve to be rendered using drawCurve()
	// this.curveSets[i][j][k] is a vector representing a curve coordinate
	for (var i = 0; i < this.curveSets.length; i++) {
		for (var j = 0; j < this.curveSets[i].length; j++) {
			drawCurve(this.curveSets[i][j], showVertices);
		}
	}

}
