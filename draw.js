var cartesian, polar, parabolic, neat, wavyPolar;
var testCurve, newCurve;
var tSetup;
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
	var xFuncNeat = (x, y) => .9*(x*y/250 + 10*cos(x/2)*sin(x/2));
	var yFuncNeat = (x, y) => .9*(-.004*sq(x) + 2*cos(y)) + height/2.2;
	var xParamNeat = new CoordinateParameter(xFuncNeat, 50, -width/2, width/2);
	var yParamNeat = new CoordinateParameter(yFuncNeat, 50, 10, height/1.8);
	neat = new Coordinate(xParamNeat, yParamNeat);
	
	// WAVY POLAR //
	var amp = 0;
	var n = 1;
	var fx1 = (x,y) => amp*cos(n*y) + x;
	var fy1 = (x,y) => .3*sin(x)+y;
	var fx2 = (x,y) => x*cos(y);
	var fy2 = (x,y) => x*sin(y);
	var xFuncWavyPolar = (x,y) => fx2(fx1(x,y),fy1(x,y));
	var yFuncWavyPolar = (x,y) => fy2(fx1(x,y),fy1(x,y));
	wavyPolar = new Coordinate();
	wavyPolar.addParameter(xFuncWavyPolar, 10, 0, height/2);
	wavyPolar.addParameter(yFuncWavyPolar, 40, 0, TWO_PI);
	
	var coordinateArr = [cartesian, polar, parabolic, neat, wavyPolar];
	for (var i = 0; i < coordinateArr.length; i++) {
		var co = coordinateArr[i];
		co.addCurveSet(co.parameters, 0, 1);
		co.addCurveSet(co.parameters, 1, 0);
	}
	
	// add Coordinate and axis arguments to Curve, or maybe a global CoordinateMode variable?
	// add parameter as option for Curve arguments
	var xFunc = (x) => x;
	var yFunc = (y) => 10*sin(10*y/30);
	
	var co = polar;
	var p = co.parameters;
	
	testCurve = new Curve(1000, 0, 30*TWO_PI, xFunc, yFunc);
	// testCurve.map('y', testCurve.getMin('y'), testCurve.getMax('y'), p[1].start, p[1].stop);
	
	initialCurve = new Curve(testCurve.numSteps, testCurve.start, testCurve.stop, testCurve.func1, testCurve.func2);
	initialCurve.map('y', initialCurve.getMin('y'), initialCurve.getMax('y'), p[1].start, p[1].stop);
	
	// testCurve.transform(p[0].func, p[1].func);
	
	// noLoop();
	tSetup = millis();
	
}

function draw() {
	
	background(230);

	// axes
	push();
	stroke(255, 0, 0, 120);
	strokeWeight(4);
	line(-width/2, 0, width/2, 0);
	line(0, -height/2, 0, height/2);
	pop();
	
	/////////////////////////////////////////
	var co = polar;
	var p = co.parameters;
	
	var xFinalArr = [];
	var yFinalArr = [];
	for (var i = 0; i < initialCurve.vertices.length; i++) {
		xFinalArr.push(p[0].func(initialCurve.vertices[i].x, initialCurve.vertices[i].y));
		yFinalArr.push(p[1].func(initialCurve.vertices[i].x, initialCurve.vertices[i].y));
	}
	
	var t = millis() - tSetup;
	
	// n = number of keyframes that get animated per iteration
	var n = 120;
	var iterations = 2;
	var fpKeyframe = 1;
	var frameTotal = n*fpKeyframe*iterations;
	if (frameCount <= frameTotal) {
		
		// count = [0, (n*iterations - 1)] = [1, (frameTotal/fpKeyframe - 1)]
		var count = floor((frameCount-1)/fpKeyframe);
		
		// keyframe = [0, n-1]
		var keyframe = count % n;
		
		var xValArr = [];
		var yValArr = [];
		for (var i = 0; i < initialCurve.vertices.length; i++) {
			var vertex = initialCurve.vertices[i];
			xValArr.push(vertex.x + keyframe*(xFinalArr[i]-vertex.x)/(n-1));
			yValArr.push(vertex.y + keyframe*(yFinalArr[i]-vertex.y)/(n-1));
		}
	
		newCurve = new Curve(initialCurve.numSteps, initialCurve.start, initialCurve.stop, initialCurve.func1, initialCurve.func2);
		
		// doesn't show mappings
		// newCurve.render();
	
		for (var i = 0; i < newCurve.vertices.length; i++){
			newCurve.vertices[i].x = xValArr[i];
			newCurve.vertices[i].y = yValArr[i];
		}
	}
	
	newCurve.render();
	
//////////////////////////////////////////////
// 	parabolic.render();
	// polar.render();
	// wavyPolar.render();
// 	cartesian.render();
	// neat.render();
	// testCurve.render();
//////////////////////////////////////////////	

}

// arguments: (required: numSteps, required: start, required: stop)
var CoordinateParameter = function(func, numSteps, start, stop) {
	
	// function used for transformations
	this.func = func;
	
	// incremented value for coordinate line calculations, number of curves will be (numSteps+1)
	this.numSteps = numSteps;

	// new coordinate range to map to, i.e. theta=[0,TWO_PI] in polar coordinates
	this.start = start;
	this.stop = stop;

}

CoordinateParameter.prototype.getStepSize = function() {
	return (this.stop - this.start)/this.numSteps;
}

var transform = function(vertex, xFunc, yFunc) {
	
	var x = xFunc(vertex.x, vertex.y);
	var y = yFunc(vertex.x, vertex.y);
	
	vertex.x = x;
	vertex.y = y;
	return vertex;
	
}

var Curve = function(numSteps, start, stop, func1, func2, param) {
	
	// pass in parameter as argument instead?? then change to parameter attributes and methods
	this.numSteps = numSteps;
	this.start = start;
	this.stop = stop;
	
	this.func1 = func1;
	this.func2 = func2;
	
	this.setVertices(func1, func2, param);
	
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

Curve.prototype.getMin = function(property) {
	var propertyArr = this.vertices.map(vertex => vertex[property]);
	return min(propertyArr);
}
Curve.prototype.getMax = function(property) {
	var propertyArr = this.vertices.map(vertex => vertex[property]);
	return max(propertyArr);
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

Curve.prototype.map = function(property, start, stop, newStart, newStop) {
	
	for (var i = 0; i < this.vertices.length; i++) {
		var vertex = this.vertices[i];			 
		vertex[property] = map(vertex[property], start, stop, newStart, newStop);
	}
	
	return this.vertices;
	
}

Curve.prototype.transform = function(func1, func2) {
	
	for (var i = 0; i < this.vertices.length; i++) {
		this.vertices[i] = transform(this.vertices[i], func1, func2);
	}
	
	return this.vertices;
	
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
			if (i > 0 && i < this.vertices.length-1){
				ellipse(this.vertices[i].x, this.vertices[i].y, 8, 8);
			}
			pop();
		}
	}
	if (showVertices == true) {
		// add circles marking control points with different style
		push();
		fill(255, 0, 0);
		var controlPoint1 = this.vertices[0];
		var controlPoint2 = this.vertices[this.vertices.length-1];
		ellipse(controlPoint1.x, controlPoint1.y, 8, 8);
		ellipse(controlPoint2.x, controlPoint2.y, 8, 8);
		pop();
	}
	
	endShape();
	
}

var CurveSet = function(paramArr, varyingParamIndex, constantParamIndex) {
	
	this.parameters = paramArr;
	
	this.varyingParam = paramArr[varyingParamIndex];
	this.constantParams = [];
	this.transformParams = [];
	for (var i = 2; i < arguments.length; i++) {
		
		this.constantParams.push(paramArr[arguments[i]]);
		
		this.transformParams.push(paramArr[arguments[i]]);
		if (i == arguments.length-1) {
			this.transformParams.push(this.varyingParam);
		}
	}
	
	this.curves = [];
	this.setCurves();
	
}

CurveSet.prototype.setCurves = function(i) {
	
	// initialize i to 0 on first call
	if (!i) { i = 0; }
	
	var curves = [];
	
	var transformParamIndex = this.parameters.indexOf(this.transformParams[i]);
	var parameter = this.parameters[transformParamIndex];
	
	var step = parameter.getStepSize();
	var condition = parameter.stop + step;
	parameter.val = parameter.start - step;
	
	// recursion loop acting as dynamically nested for loops, where number of for loops is determined by length of transformParams array
	while (parameter.val <= condition) {

		// second to last loop
		if (i == this.transformParams.length-2) {
			
			var transformParamIndex = this.parameters.indexOf(this.transformParams[i+1]);
			var transformParam = this.parameters[transformParamIndex];
			
			// innermost loop
			var xFunc = (x) => this.parameters[0].val;
			var yFunc = (y) => this.parameters[1].val;
			var curve = new Curve(transformParam.numSteps, transformParam.start, transformParam.stop, xFunc, yFunc, transformParam);
			curve.transform(this.parameters[0].func, this.parameters[1].func);
			
			curves.push(curve);
			
		} else {
			this.setCurves(i+1);
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

// arguments (required: parameter - add any number CoordinateParameter objects)
// OR pass in a string to get a default Coordinate. options: 'cartesian', 'polar', 'parabolic'
var Coordinate = function(parameter) {
	
	this.parameters = [];
	this.curveSets = [];
	
	if ( typeof(parameter) === 'string' ) {
		
		var coordinateType = parameter;
		this.setDefault(coordinateType);
		
	} else {
		
		for (var i = 0; i < arguments.length; i++) {
			this.parameters.push(arguments[i]);
		}	
		
	}	
}

Coordinate.prototype.setDefault = function(coordinateType) {
	
	if (coordinateType == 'cartesian') {
		
		var xFunc = (x, y) => x;
		var yFunc = (x, y) => y;
		this.addParameter(xFunc, 40, -width/2, width/2);
		this.addParameter(yFunc, 40, -height/2, height/2);
		
	} else if (coordinateType == 'polar') {

		var xFunc = (x, y) => x*cos(y);
		var yFunc = (x, y) => x*sin(y);
		this.addParameter(xFunc, 10, 0, height/2);
		this.addParameter(yFunc, 48, 0, TWO_PI);
		
	} else if (coordinateType == 'parabolic') {
		
		var scalefactor = .0035;
		var xFunc = (x, y) => scalefactor*( x*y );
		var yFunc = (x, y) => scalefactor*( (sq(y)-sq(x))/2 );
		this.addParameter(xFunc, 30, -width/2, width/2);
		this.addParameter(yFunc, 30, -width/2, width/2);
		
	}
	
}

// 1 argument: (required: CoordinateParameter object)
// OR 4 arguments: (required: numSteps, required: start, required: stop)
Coordinate.prototype.addParameter = function(func, numSteps, start, stop) {

	if (arguments.length == 1) {
		// if only one argument is given, it will be a CoordinateParameter object
		var parameter = arguments[0];
	} else {
		var parameter = new CoordinateParameter(func, numSteps, start, stop);
	}
	
	this.parameters.push(parameter);
	return parameter;
}

// arguments: (required: paramArr, required: varyingParamIndex, optional: constantParamIndex - add any number parameter indeces)
Coordinate.prototype.addCurveSet = function(paramArr, varyingParamIndex, constantParamIndex) {
	
	var curveSet = new CurveSet(...arguments);

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
