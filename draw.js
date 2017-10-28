var cartesian, polar, parabolic, neat, wavyPolar;
var testCurve;
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
	var xParamNeat = new CoordinateParameter(50, -width/2, width/2);
	var yParamNeat = new CoordinateParameter(50, 10, height/1.8);
	neat = new Coordinate(uFuncNeat, vFuncNeat, xParamNeat, yParamNeat);
	
	// WAVY POLAR //
	var amp = 0;
	var n = 1;
	var fx1 = (x,y) => amp*cos(n*y) + x;
	var fy1 = (x,y) => .3*sin(x)+y;
	var fx2 = (x,y) => x*cos(y);
	var fy2 = (x,y) => x*sin(y);
	var uFuncWavyPolar = (x,y) => fx2(fx1(x,y),fy1(x,y));
	var vFuncWavyPolar = (x,y) => fy2(fx1(x,y),fy1(x,y));
	wavyPolar = new Coordinate(uFuncWavyPolar, vFuncWavyPolar);
	wavyPolar.addParameter(10, 0, height/2);
	wavyPolar.addParameter(40, 0, TWO_PI);
	
	var coordinateArr = [cartesian, polar, parabolic, neat, wavyPolar];
	for (var i = 0; i < coordinateArr.length; i++) {
		var co = coordinateArr[i];
		co.addCurveSet(co.parameters[0],co.parameters[1]);
		co.addCurveSet(co.parameters[1],co.parameters[0]);
	}
	
	// var xFunc = (x) => 200*cos(x);
	var xFunc = (x) => x;
	var yFunc = (x) => 200*sin(10*x/30);
	testCurve = new Curve(5000, 0, 30*TWO_PI, xFunc, yFunc);

	var co = polar;

	testCurve.transform(co.uFunc, testCurve.xMin, testCurve.xMax, co.parameters[0].start, co.parameters[0].stop, co.vFunc, testCurve.yMin, testCurve.yMax, co.parameters[1].start, co.parameters[1].stop);
		
		// noLoop();
	
}

// global draw variables
var dt = .1;
var t = 0;
var tStep = 20;
var count = 0;
var mult = 1;
function draw() {
	
	background(230);

	// axes
	push();
	stroke(255,0,0,120);
	strokeWeight(4);
	line(-width/2, 0, width/2, 0);
	line(0, -height/2, 0, height/2);
	pop();
	
//////////////////////////////////////////////
	if (t >= 0 && t < tStep) {
		parabolic.render();
	} else if (t >= tStep && t < 2*tStep) {
		polar.render();
	} else if (t >= 2*tStep && t < 3*tStep) {
		wavyPolar.render();
	} else if (t >= 3*tStep && t < 4*tStep) {
		cartesian.render();
	} else if (t >= 4*tStep && t < 5*tStep) {
		neat.render();
	} else if (t >= 5*tStep && t < 6*tStep) {
		testCurve.render();
	} else {
		t = 0;
	}
	t += dt;
//////////////////////////////////////////////	
	
//////////////////////////////////////////////
// 	// uncomment for animation stepping through curves of chosen coordinate system (co)
// 	var co = parabolic;
// 	var countStep = 3;
// 	var i = floor(count) % co.curveSets[0].curves.length;
// 	var j = floor(count) % co.curveSets[1].curves.length;
// 	count += 1/countStep;
	
// 	co.curveSets[0].curves[i].render();
// 	co.curveSets[1].curves[j].render();
//////////////////////////////////////////////

}

// arguments: (required: numSteps, required: start, required: stop)
var CoordinateParameter = function(numSteps, start, stop) {
		
	// incremented value for coordinate line calculations, number of curves will be (numSteps+1)
	this.numSteps = numSteps;

	// new coordinate range to map to, i.e. theta=[0,TWO_PI] in polar coordinates
	this.start = start;
	this.stop = stop;

}

CoordinateParameter.prototype.getStepSize = function() {
	return (this.stop - this.start)/this.numSteps;
}

var transform = function(coordinate, uFunction, vFunction) {
	
	var x = uFunction(coordinate.x, coordinate.y);
	var y = vFunction(coordinate.x, coordinate.y);
	
	coordinate.x = x;
	coordinate.y = y;
	return coordinate;
	
}

var Curve = function(numSteps, start, stop, func1, func2, param) {
	
	// pass in parameter as argument instead?? then change to parameter attributes and methods
	this.numSteps = numSteps;
	this.start = start;
	this.stop = stop;
	
	this.setVertices(func1, func2, param);
	
	var xArr = this.vertices.map(vertex => vertex.x);
	var yArr = this.vertices.map(vertex => vertex.y);

	this.xMin = min(xArr);
	this.xMax = max(xArr);
	this.yMin = min(yArr);
	this.yMax = max(yArr);
	
	if (this.xMin == this.xMax) {
		this.xMin = start;
		this.xMax = stop;
	}
	if (this.yMin == this.yMax) {
		this.yMin = start;
		this.yMax = stop;
	}
}

Curve.prototype.getStepSize = function() {
	return (this.stop - this.start)/this.numSteps;
}
Curve.prototype.getControlStart = function() {
	return this.start - this.getStepSize();
}
Curve.prototype.getControlStop = function() {
	return this.stop + this.getStepSize();
}

Curve.prototype.setVertices = function(func1, func2, param) {
	
	this.vertices = [];
	
	for (var i = this.getControlStart(); i <= this.getControlStop(); i += this.getStepSize()) {
		if (param) {
			param.val = i;
		}
		var coordinate = createVector(func1(i), func2(i));
		this.vertices.push(coordinate);
	}
	
}

Curve.prototype.transform = function(func1, start1, stop1, newStart1, newStop1, func2, start2, stop2, newStart2, newStop2) {
	
	for (var i = 0; i < this.vertices.length; i++) {
		var vertex = this.vertices[i];			 
		vertex.x = map(vertex.x, start1, stop1, newStart1, newStop1);
		vertex.y = map(vertex.y, start2, stop2, newStart2, newStop2);
		transform(this.vertices[i], func1, func2);
	}
	
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
				ellipse(this.vertices[i].x,this.vertices[i].y,8,8);
			}
			if (i != 0 && i != this.vertices.length-1){
				ellipse(this.vertices[i].x,this.vertices[i].y,8,8);
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

CurveSet.prototype.addCurves = function(thisCoordinate, i) {
	
	// initialize i to 0 on first call
	if (!i) { i = 0; }
	
	var curves = [];

	var transformParamIndex = thisCoordinate.parameters.indexOf(this.transformParams[i]);
	var parameter = thisCoordinate.parameters[transformParamIndex];
	
	var step = parameter.getStepSize();
	var condition = parameter.stop + step;
	parameter.val = parameter.start - step;
	
	// recursion loop acting as dynamically nested for loops, where number of for loops is determined by length of transformParams array (i.e., number of arguments passed into addCurveSet method)
	while (parameter.val <= condition) {

		// second to last loop
		if (i == this.transformParams.length-2) {
			
			var p = thisCoordinate.parameters;
			
			var transformParamIndex = p.indexOf(this.transformParams[i+1]);
			var transformParam = p[transformParamIndex];
			
			// innermost loop
			var xFunc = (x) => p[0].val;
			var yFunc = (y) => p[1].val;
			var curve = new Curve(transformParam.numSteps, transformParam.start, transformParam.stop, xFunc, yFunc, transformParam);

			curve.transform(thisCoordinate.uFunc, p[0].start, p[0].stop, p[0].start, p[0].stop, thisCoordinate.vFunc, p[1].start, p[1].stop, p[1].start, p[1].stop);

			curves.push(curve);
			
		} else {
			this.addCurves(thisCoordinate, i+1);	
		}

		parameter.val += step;
	}

	//remove first and last curves, which are made up of control points and shouldn't be included
	curves.shift();
	curves.pop();
	
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
		this.addParameter(10, 0, height/2);
		this.addParameter(48, 0, TWO_PI);
		
	} else if (coordinateType == 'parabolic') {
		
		var scalefactor = .0035;
		this.uFunc = (x, y) => scalefactor*( x*y );
		this.vFunc = (x, y) => scalefactor*( (sq(y)-sq(x))/2 );
		this.addParameter(30, -width/2, width/2);
		this.addParameter(30, -width/2, width/2);
		
	}
	
}

// 1 argument: (required: CoordinateParameter object)
// OR 5 arguments: (required: numSteps, required: start, required: stop)
Coordinate.prototype.addParameter = function(numSteps, start, stop) {

	if (arguments.length == 1) {
		// if only one argument is given, it will be a CoordinateParameter object
		var parameter = arguments[0];
	} else {
		var parameter = new CoordinateParameter(numSteps, start, stop);
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
	// var scale = [1, 1, 1, 1];
	// var stretch = [0, 0, 0, 0];
	// this.uStart = scale[0]*this.parameters[0].start + stretch[0];
	// this.uStop = scale[1]*this.parameters[0].stop + stretch[1];
	// this.vStart = scale[2]*this.parameters[1].start + stretch[2];
	// this.vStop = scale[3]*this.parameters[1].stop + stretch[3];
	
	var curveSet = new CurveSet(...arguments);
	curveSet.addCurves(this);

	this.curveSets.push(curveSet);
	return curveSet;
}

Coordinate.prototype.render = function(showVertices) {

	// this.curveSets[i].curves[j].vertices[k].x
	// call render method for every CurveSet in Coordinate
	for (var i = 0; i < this.curveSets.length; i++) {
		this.curveSets[i].render(showVertices);
	}
	
}
