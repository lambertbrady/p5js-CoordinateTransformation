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

// global draw variables
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

var Curve = function() {
	
	this.vertices = [];
	
}

Curve.prototype.getVertex = function(thisCoordinate) {
		
	var p = thisCoordinate.parameters;

	// sets range of new parameter values
	// use this same technique to start from arbitrary coordinate system (right now it's stepping through cartesian coordinates)
	var newX = map(p[0].var, p[0].start, p[0].stop, p[0].newStart, p[0].newStop);
	var newY = map(p[1].var, p[1].start, p[1].stop, p[1].newStart, p[1].newStop);

	var vertex = createVector(thisCoordinate.uFunc(newX,newY), thisCoordinate.vFunc(newX,newY));

	// scales or translates entire uv-coordinate system
	vertex.x = map(vertex.x, p[0].start, p[0].stop, thisCoordinate.uStart, thisCoordinate.uStop);
	vertex.y = map(vertex.y, p[1].start, p[1].stop, thisCoordinate.vStart, thisCoordinate.vStop);

	return vertex;
	
}

// arguments: (showVertices: bool - should vertices be displayed?)
Curve.prototype.render = function(showVertices) {

	noFill();
	beginShape();
	
	// control points included as curve vertices
	for (var i = 0; i < this.vertices.length; i++) {
		curveVertex(this.vertices[i].x, this.vertices[i].y);
		
		if (showVertices == true) {
			// add circles marking vertices
			push();
			// make control points red
			if (i == 0 || i == this.vertices.length-1) {
				fill(255,0,0);
			}
			if (i != 0 && i != this.vertices.length-1){
				ellipse(arr[i].x,this.vertices[i].y,10,10);
			}
			pop();
		}
	}
	
	endShape();
	
}

var CurveSet = function(varyingParam, constantParam) {
	
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
	
	this.curves = [];
	
}

CurveSet.prototype.getCurves = function(thisCoordinate, i, recursiveCurve) {
	
	// initialize i to 0 on first call
	if (!i) { i = 0; }
	
	var curves = [];

	var transformParamIndex = thisCoordinate.parameters.indexOf(this.transformParams[i]);
	var parameter = thisCoordinate.parameters[transformParamIndex];
	
	var step = parameter.getStepSize();
	var condition = parameter.stop + step;
	parameter.var = parameter.start - step;
	
	// recursion loop acting as dynamically nested for loops, where number of for loops is determined by length of transformParams array (i.e., number of arguments passed into addCurveSet method)
	while (parameter.var <= condition) {

		// innermost loop
		if (i == this.transformParams.length-1) {
			// vertices
			recursiveCurve.vertices.push(recursiveCurve.getVertex(thisCoordinate));
		// second to last loop
		} else if (i == this.transformParams.length-2) {
			var curve = new Curve();
			this.getCurves(thisCoordinate, i+1, curve);
			curves.push(curve);
		} else {
			this.getCurves(thisCoordinate, i+1);	
		}

		parameter.var += step;
	}

	//remove first and last curves, which are made up of control points and shouldn't be rendered
	curves.shift();
	curves.pop();

	return curves;
	
}

CurveSet.prototype.addCurves = function(thisCoordinate) {
	
	var curves = this.getCurves(thisCoordinate);

	this.curves = curves;
	return curves;
	
}

CurveSet.prototype.render = function(showVertices) {
	
	// call render method for every Curve in CurveSet
	for (var i = 0; i < this.curves.length; i++) {
		this.curves[i].render(showVertices);
	}
	
}

// arguments (required: ufunction, required: vfunction, optional: CoordinateParameter - add any number parameters)
// OR pass in a string to get a default Coordinate. options: 'cartesian', 'polar', 'parabolic'
var Coordinate = function(uFunction, vFunction, parameter) {
	
	this.uFunc = uFunction;
	this.vFunc = vFunction;
	
	this.parameters = [];
	this.curveSets = [];
	
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
		var parameter = arguments[0];
		
	} else {
		
		var parameter = new CoordinateParameter(numSteps, start, stop, newStart, newStop);
		
	}
	
	this.parameters.push(parameter);
	
	return parameter;
	
}

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

	var curveSet = new CurveSet(...arguments);
	curveSet.addCurves(this);

	this.curveSets.push(curveSet);
	return curveSet;
}

Coordinate.prototype.render = function(showVertices) {
	
	this.curveSets = [];
	
	// x-curves: lines of constant y
	this.addCurveSet(this.parameters[0], this.parameters[1]);
	// y-curves: lines of constant x
	this.addCurveSet(this.parameters[1], this.parameters[0]);
	// example of 3D z-curve call
	// this.addCurveSet(this.parameters[2], this.parameters[0], this.parameters[1]);

	// this.curveSets[i].curves[j].vertices[k].x
	// 
	// call render method for every CurveSet in Coordinate
	for (var i = 0; i < this.curveSets.length; i++) {
		this.curveSets[i].render(showVertices);
	}
	
}
