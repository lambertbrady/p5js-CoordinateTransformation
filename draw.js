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
	cartesian = new Coordinate(uFuncCartesian, vFuncCartesian, xParamCartesian, yParamCartesian);
	
	// PARABOLIC //
	// the .0055 is just there to scale the whole thing down a bit to fit it in the canvas. I'll add a scaling method to handle this later
	var uFuncParabolic = (x, y) => .0055*( x*y );
	var vFuncParabolic = (x, y) => .0055*( (sq(y)-sq(x))/2 );
	parabolic = new Coordinate(uFuncParabolic, vFuncParabolic);
	parabolic.addParameter(50, -width/2, width/2, -width/2, width/2);
	parabolic.addParameter(50, -width/2, width/2, -width/2, width/2);
	
	// POLAR //
	var uFuncPolar = (x, y) => x*cos(y);
	var vFuncPolar = (x, y) => x*sin(y);
	var xParamPolar = new CoordinateParameter(10, -width/2, width/2, 0, height/2);
	var yParamPolar = new CoordinateParameter(20, -height/2, height/2, 0, TWO_PI);
	polar = new Coordinate(uFuncPolar, vFuncPolar, xParamPolar, yParamPolar);
	
	// NEAT THING //
	var uFuncNeat = (x, y) => .9*(x*y/250 + 10*cos(x/2)*sin(x/2));
	var vFuncNeat = (x, y) => .9*(-.004*sq(x) + 2*cos(y)) + height/2.2;
	var xParamNeat = new CoordinateParameter(50, -width/2, width/2, -width/2, width/2);
	var yParamNeat = new CoordinateParameter(50, -height/2, height/2, 10, height/1.8);
	neat = new Coordinate(uFuncNeat, vFuncNeat, xParamNeat, yParamNeat);
	
}


var dt = .1;
var t = 0;
var tStep = 25;
var steps = 2;

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
			// //add circles marking points for testing
			push();
			//make control points red
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
var Coordinate = function(uFunction, vFunction, parameter) {

	this.uFunc = uFunction;
	this.vFunc = vFunction;
	
	this.parameters = [];
	
	// any arguments after uFunction and vFunction added to array of CoordinateParameter objects
	for (var i = 2; i < arguments.length; i++) {
		this.parameters.push(arguments[i]);
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

// arguments: (required: varyingParam, optional: constantParam - add any number parameters)
Coordinate.prototype.transform = function(varyingParam, constantParam) {

	// should these be somewhare else??? right now it's set to map everything to where it began
	// add rotation option
	var scale = 1;
	var translate = 0;  // only translates if all are the same, but possible to pin sides down
	this.uStart = scale*this.parameters[0].start + translate;
	this.uStop = scale*this.parameters[0].stop + translate;
	this.vStart = scale*this.parameters[1].start + translate;
	this.vStop = scale*this.parameters[1].stop + translate;
	
	var constantParams = [];
	// any arguments after constantParam added to array of CoordinateParameter objects
	for (var i = 1; i < arguments.length; i++) {
		constantParams.push(arguments[i]);
	}
	
	var getCoordinate = function(x,y) {
		
		// sets range of new parameter values
		var newX = map(x, this.parameters[0].start, this.parameters[0].stop, this.parameters[0].newStart, this.parameters[0].newStop);
		var newY = map(y, this.parameters[1].start, this.parameters[1].stop, this.parameters[1].newStart, this.parameters[1].newStop);

		var coordinate = createVector(this.uFunc(newX,newY), this.vFunc(newX,newY));

		// scales or translates entire uv-coordinate system
		coordinate.x = map(coordinate.x, this.parameters[0].start, this.parameters[0].stop, this.uStart, this.uStop);
		coordinate.y = map(coordinate.y, this.parameters[1].start, this.parameters[1].stop, this.vStart, this.vStop);

		return coordinate;
		
	}.bind(this);
	
	
	var curveArr = [];
	
	if (varyingParam == this.parameters[0]) {
		//add one more vector on each side for control points
		for (var y = this.parameters[1].start - this.parameters[1].getStepSize(); y <= this.parameters[1].stop + this.parameters[1].getStepSize(); y += this.parameters[1].getStepSize()) {
			var curve = [];
			for (var x = this.parameters[0].start - this.parameters[0].getStepSize(); x <= this.parameters[0].stop + this.parameters[0].getStepSize(); x += this.parameters[0].getStepSize()) {
				curve.push(getCoordinate(x,y));
			}
			curveArr.push(curve);
		}
	} else if (varyingParam == this.parameters[1]) {
		//add one more vector on each side for control points
		for (var x = this.parameters[0].start - this.parameters[0].getStepSize(); x <= this.parameters[0].stop + this.parameters[0].getStepSize(); x += this.parameters[0].getStepSize()) {
			var curve = [];
			for (var y = this.parameters[1].start - this.parameters[1].getStepSize(); y <= this.parameters[1].stop + this.parameters[1].getStepSize(); y += this.parameters[1].getStepSize()) {
				curve.push(getCoordinate(x,y));
			}
			curveArr.push(curve);
		}
	}
		
	//remove first and last curves which are made up of control points
	curveArr.shift();
	curveArr.pop();
	
	return curveArr;
}

Coordinate.prototype.render = function(showVertices) {
	// x-curves: lines of constant y
	this.xCurves = this.transform(this.parameters[0], this.parameters[1]);
	// y-curves: lines of constant x
	this.yCurves = this.transform(this.parameters[1], this.parameters[0]);

	for (var i = 0; i < this.xCurves.length; i++) {
		addCurve(this.xCurves[i], showVertices);
	}
	for (var i = 0; i < this.yCurves.length; i++) {
		addCurve(this.yCurves[i], showVertices);
	}
	
}
