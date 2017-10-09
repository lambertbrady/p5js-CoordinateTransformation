function setup() {
	frameRate(60);  //default value is 60
	canvas = createCanvas(700, 500);
	//set origin to center of canvas
	canvas.translate(width/2, height/2);

	// CARTESIAN //
	var uFuncCartesian = (x, y) => x;
	var vFuncCartesian = (x, y) => y;
	var xParamCartesian = new CoordinateParameter(40, -width/2, width/2, -width/2, width/2);
	var yParamCartesian = new CoordinateParameter(40, -height/2, height/2, -height/2, height/2);
	cartesian = new Coordinates(uFuncCartesian, vFuncCartesian, xParamCartesian, yParamCartesian);
	
	// PARABOLIC //
	// the .0055 is just there to scale the whole thing down a bit to fit it in the canvas. I'll add a scaling method to handle this later
	var uFuncParabolic = (x, y) => .0055*( x*y );
	var vFuncParabolic = (x, y) => .0055*( (sq(y)-sq(x))/2 );
	parabolic = new Coordinates(uFuncParabolic, vFuncParabolic);
	parabolic.setParameter('x', 50, -width/2, width/2, -width/2, width/2);
	parabolic.setParameter('y', 50, -width/2, width/2, -width/2, width/2);
	
	// POLAR //
	var uFuncPolar = (x, y) => x*cos(y);
	var vFuncPolar = (x, y) => x*sin(y);
	var xParamPolar = new CoordinateParameter(10, -width/2, width/2, 0, height/2);
	var yParamPolar = new CoordinateParameter(20, -height/2, height/2, 0, TWO_PI);
	polar = new Coordinates(uFuncPolar, vFuncPolar, xParamPolar, yParamPolar);
	
	// NEAT THING //
	var uFuncNeat = (x, y) => .9*(x*y/250 + 10*cos(x/2)*sin(x/2));
	var vFuncNeat = (x, y) => .9*(-.004*sq(x) + 2*cos(y)) + height/2.2;
	var xParamNeat = new CoordinateParameter(50, -width/2, width/2, -width/2, width/2);
	var yParamNeat = new CoordinateParameter(50, -height/2, height/2, 10, height/1.8);
	neat = new Coordinates(uFuncNeat, vFuncNeat, xParamNeat, yParamNeat);
}


var dt = .1;
var t = 0;
var tStep = 25;

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

// (arg1: array of vectors, arg2: bool - should vertices be displayed?)
var addCurve = function(arr, showVertices) {

	noFill();
	beginShape();
	
	// control points included as curve vertices
	for (var i = 0; i < arr.length; i++) {
		curveVertex(arr[i].x, arr[i].y);
		
		if (showVertices == true) {
			// //add circles marking points for testing
			push();
			//make control points red
			if (i == 0 || i == arr.length-1) {
				fill(255,0,0);
			}
			ellipse(arr[i].x,arr[i].y,10,10);
			pop();
		}
	}
	
	endShape();
}

// arguments: (required: numSteps, optional: start, optional: stop, optional: newStart, optional: newStop)
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

// arguments (required: ufunction, required: vfunction, optional: xCoordinateParameter, optional: yCoordinateParameter)
var Coordinates = function(uFunction, vFunction, xParameter, yParameter) {

	this.uFunc = uFunction;
	this.vFunc = vFunction;
	
	// true if third argument included
	if (xParameter) {
		this.setParameter('x', xParameter);
		
		// true if fourth argument included
		if (yParameter) {
			this.setParameter('y', yParameter);
		}
	}
	
}

Coordinates.prototype.setParameter = function(paramType, numSteps, start, stop, newStart, newStop) {

	if (arguments.length == 1) {
		
		// range calculated to fit within the smallest canvas edge
		var minEdge = min(width, height);
		
		// default CoordinateParameter arguments if not given
		numSteps = 50;
		start = newStart = -minEdge/2;
		stop = newStop = minEdge/2;
		
		var newParam = new CoordinateParameter(numSteps, start, stop, newStart, newStop);
		
	} else if (arguments.length == 2) {
		
		// if only two arguments are given, the first will be paramType and the second will be a CoordinateParameter object
		var newParam = arguments[1];
		
	} else {
		
		var newParam = new CoordinateParameter(numSteps, start, stop, newStart, newStop);
		
	} 
	
	// set parameter value in Coordinate object
	if (paramType == 'x') {
		this.xParam = newParam;
	} else if (paramType == 'y') {
		this.yParam = newParam;
	}
	
	return newParam;
	
}

Coordinates.prototype.transform = function(xParam, yParam, curveType) {
	
	// should these be somewhare else??? right now it's set to map everything to where it began
	// add rotation option
	var scale = .5;
	var translate = 0;  // only translates if all are the same, but possible to pin sides down
	this.uStart = scale*this.xParam.start + translate;
	this.uStop = scale*this.xParam.stop + translate;
	this.vStart = scale*this.yParam.start + translate;
	this.vStop = scale*this.yParam.stop + translate;
	
	var curveArr = [];
	
	var getCoordinate = function(x,y) {
		
		// sets range of new parameter values
		var newX = map(x, xParam.start, xParam.stop, xParam.newStart, xParam.newStop);
		var newY = map(y, yParam.start, yParam.stop, yParam.newStart, yParam.newStop);
		var coordinate = createVector(this.uFunc(newX,newY), this.vFunc(newX,newY));

		// scales or translates entire uv-coordinate system
		coordinate.x = map(coordinate.x, xParam.start, xParam.stop, this.uStart, this.uStop);
		coordinate.y = map(coordinate.y, yParam.start, yParam.stop, this.vStart, this.vStop);
		
		return coordinate;
		
	}.bind(this);
	
	if (curveType == 'x') {
		
		//add one more vector on each side for control points
		for (var y = yParam.start - yParam.getStepSize(); y <= yParam.stop + yParam.getStepSize(); y += yParam.getStepSize()) {
			var curve = [];
			for (var x = xParam.start - xParam.getStepSize(); x <= xParam.stop + xParam.getStepSize(); x += xParam.getStepSize()) {
				curve.push(getCoordinate(x,y));
			}
			curveArr.push(curve);
		}
		
	} else if (curveType == 'y') {
		
		//add one more vector on each side for control points
		for (var x = xParam.start - xParam.getStepSize(); x <= xParam.stop + xParam.getStepSize(); x += xParam.getStepSize()) {
			var curve = [];
			for (var y = yParam.start - yParam.getStepSize(); y <= yParam.stop + yParam.getStepSize(); y += yParam.getStepSize()) {
				curve.push(getCoordinate(x,y));
			}
			curveArr.push(curve);
		}
		
	}
	
	//remove first and last curves which are made up of control points
	curveArr.shift();
	curveArr.pop();
	
	return curveArr;
	// return getCoordinate(x,y);
}

Coordinates.prototype.render = function(showVertices) {
	// x-curves: lines of constant y
	this.xCurves = this.transform(this.xParam, this.yParam, 'x');
	// y-curves: lines of constant x
	this.yCurves = this.transform(this.xParam, this.yParam, 'y');
	
	for (var i = 0; i < this.xCurves.length; i++) {
		addCurve(this.xCurves[i], showVertices);
	}
	for (var i = 0; i < this.yCurves.length; i++) {
		addCurve(this.yCurves[i], showVertices);
	}
	
}
