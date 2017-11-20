var cartesian, polar, parabolic, neat, wavyPolar;
var testCurve;
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

// 	// NEAT THING //
// 	var xFuncNeat = (x, y) => .9*(x*y/250 + 10*cos(x/2)*sin(x/2));
// 	var yFuncNeat = (x, y) => .9*(-.004*sq(x) + 2*cos(y)) + height/2.2;
// 	var xParamNeat = new CoordinateParameter(xFuncNeat, 50, -width/2, width/2);
// 	var yParamNeat = new CoordinateParameter(yFuncNeat, 50, 10, height/1.8);
// 	neat = new Coordinate(xParamNeat, yParamNeat);
	
// 	// WAVY POLAR //
// 	var amp = 0;
// 	var n = 1;
// 	var fx1 = (x,y) => amp*cos(n*y) + x;
// 	var fy1 = (x,y) => .3*sin(x)+y;
// 	var fx2 = (x,y) => x*cos(y);
// 	var fy2 = (x,y) => x*sin(y);
// 	var xFuncWavyPolar = (x,y) => fx2(fx1(x,y),fy1(x,y));
// 	var yFuncWavyPolar = (x,y) => fy2(fx1(x,y),fy1(x,y));
// 	wavyPolar = new Coordinate();
// 	wavyPolar.addParameter(xFuncWavyPolar, 10, 0, height/2);
// 	wavyPolar.addParameter(yFuncWavyPolar, 40, 0, TWO_PI);
	
// 	var coordinateArr = [cartesian, polar, parabolic, neat, wavyPolar];
// 	for (var i = 0; i < coordinateArr.length; i++) {
// 		var co = coordinateArr[i];
// 		co.addCurveSet(co.parameters, 0, 1);
// 		co.addCurveSet(co.parameters, 1, 0);
// 	}
	
	var co = polar;
	var p = co.parameters;
	
	// var xFunc = (x) => 100;
	var xFunc = (x) => x;
	var yFunc = (y) => 100*sin(10*y/30);
	// var yFunc = (y) => y;
	
	var p1 = new CoordinateParameter(xFunc, 0, 30*TWO_PI);
	var p2 = new CoordinateParameter(yFunc, -100, 100);
	// p2 range currently doesn't contribute
	testCurve = new Curve(1000, [p1,p2]);
	// map along x-axis
	testCurve.map(0, 0, 200);
	// map along y-axis
	testCurve.map(1, 0, TWO_PI);
	
	testCurve.transform(p[0].func, p[1].func);

	noLoop();
	// tSetup = millis();
	
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
// 	var t = millis() - tSetup;
	
	// newCurve = testCurve.animate(polar, 3, 2, 60);
	// newCurve.render();
//////////////////////////////////////////////
// 	parabolic.render();
	// polar.render();
	// wavyPolar.render();
// 	cartesian.render();
	// neat.render();
	testCurve.render();
//////////////////////////////////////////////	

}

// arguments: (required: numSteps, required: start, required: stop)
var CoordinateParameter = function(func, start, stop) {
	
	// function used for transformations
	this.func = func;

	// new coordinate range to map to, i.e. theta=[0,TWO_PI] in polar coordinates
	this.start = start;
	this.stop = stop;

}

// use dict instead once nVector library is added
var getDimensionProperty = function(dimension) {
	
	var property;
	switch(dimension) {
		case 0:
			property = 'x';
			break;
		case 1:
			property = 'y';
			break;
		case 2:
			property = 'z';
			break;
		default:
			property = 'x';
	}
	
	return property;
	
}

var transform = function(vertex, xFunc, yFunc) {
	
	var x = xFunc(vertex.x, vertex.y);
	var y = yFunc(vertex.x, vertex.y);
	
	vertex.x = x;
	vertex.y = y;
	
	return vertex;
	
}

var Curve = function(numSteps, paramArr, param) {
	
	// incremented value for coordinate line calculations, number of curves will be (numSteps+1)
	this.numSteps = numSteps;
	
	this.parameters = paramArr;
	
	this.vertices = [];
	this.setVertices(param);
	
	this.mappings = [];
	this.transformations = [];

	// will include new mappings, transformations
	this.updates = [];
	
	this.updateIndex = 0;
	this.needsUpdate;
	
}

Curve.prototype.getStepSize = function(dimension) {
	var parameter = this.parameters[dimension];
	return (parameter.stop - parameter.start)/this.numSteps;
}
Curve.prototype.getControlStart = function(dimension) {
	var parameter = this.parameters[dimension];
	return parameter.start - this.getStepSize(dimension);
}
Curve.prototype.getControlStop = function(dimension) {
	var parameter = this.parameters[dimension];
	return parameter.stop + this.getStepSize(dimension);
}

Curve.prototype.setVertices = function(param) {
	
	for (var i = this.getControlStart(0); i <= this.getControlStop(0); i += this.getStepSize(0)) {
		
		if (param) { param.val = i; }
		
		var coordinate = createVector(this.parameters[0].func(i), this.parameters[1].func(i));
		this.vertices.push(coordinate);
		
	}
	
}

Curve.prototype.getPropertyArray = function(dimension) {
	
	var property = getDimensionProperty(dimension);
	var arr = this.vertices.map(vertex => vertex[property]);
	// remove control points from array
	arr.shift();
	arr.pop();
	
	return arr;
}

Curve.prototype.getMin = function(dimension) {
	var propertyArr = this.getPropertyArray(dimension);
	return min(propertyArr);
}
Curve.prototype.getMax = function(dimension) {
	var propertyArr = this.getPropertyArray(dimension);
	return max(propertyArr);
}

var Mapping = function(dimension, startInitial, stopInitial, startFinal, stopFinal) {
	
	this.dimension = dimension;
	this.startInitial = startInitial;
	this.stopInitial = stopInitial;
	this.startFinal = startFinal;
	this.stopFinal = stopFinal;
	
}

Curve.prototype.map = function(dimension, newStart, newStop) {
	
	var initStart = this.getMin(dimension);
	var initStop = this.getMax(dimension);
	
	if (initStart != initStop) {
	
		var mapping = new Mapping(dimension, initStart, initStop, newStart, newStop);

		this.mappings.push(mapping);

		this.updates.push({type: 'mapping', updateObject: mapping});
		this.needsUpdate = true;
		
	}
}

var Transformation = function(funcArr) {
	this.funcArr = funcArr;
}

Curve.prototype.transform = function(func) {
	
	var funcArr = [...arguments];
	
	while (funcArr.length < this.parameters.length) {
		var newFunc = (x) => x;
		funcArr.push(newFunc);
	}
	
	var transformation = new Transformation(funcArr);
	this.transformations.push(transformation);
	
	this.updates.push({type: 'transformation', updateObject: transformation});
	this.needsUpdate = true;
	
}

Curve.prototype.updateFromMapping = function(mapping) {
	
	var property = getDimensionProperty(mapping.dimension);
	// update vertices
	for (var i = 0; i < this.vertices.length; i++) {
		var vertex = this.vertices[i];			 
		vertex[property] = map(vertex[property], mapping.startInitial, mapping.stopInitial, mapping.startFinal, mapping.stopFinal);
	}
	
}

Curve.prototype.updateFromTransformation = function(transformation) {
	// update vertices
	for (var j = 0; j < this.vertices.length; j++) {
		var vertex = this.vertices[j];
		vertex = transform(vertex, ...transformation.funcArr);
	}
}

Curve.prototype.updateVertices = function() {
	
	if (this.needsUpdate) {
		
		for (var i = this.updateIndex; i < this.updates.length; i++) {
			
			var update = this.updates[i];
			switch(update.type) {
				case 'mapping':
					var mapping = update.updateObject;
					this.updateFromMapping(mapping);
					break;
				case 'transformation':
					var transformation = update.updateObject;
					this.updateFromTransformation(transformation);
					break;
				default:
					break;
			}
			
		}
		this.updateIndex = this.updates.length;
		this.needsUpdate = false;
	}
	
}

Curve.prototype.animate = function(coordinate, n, iterations, fpKeyframe) {
	
	var p = coordinate.parameters;
	
	// n = number of keyframes that get animated per iteration
	
	// set default
	if (!fpKeyframe) {
		fpKeyframe = 1;
	}

	var newCurve = new Curve(this.numSteps, this.start, this.stop, this.func1, this.func2);
	
	var xFinalArr = [];
	var yFinalArr = [];
	for (var i = 0; i < this.vertices.length; i++) {
		xFinalArr.push(p[0].func(this.vertices[i].x, this.vertices[i].y));
		yFinalArr.push(p[1].func(this.vertices[i].x, this.vertices[i].y));
	}
	
	var frameTotal = n*fpKeyframe*iterations;
	
	var getKeyframe = function(frameCountVal) {
		
		// final keyframe persists after animation is complete
		if (frameCountVal > frameTotal) {
			frameCountVal = frameTotal;
		}
		
		// count = [0, (n*iterations - 1)] = [1, (frameTotal/fpKeyframe - 1)]
		var count = floor((frameCountVal-1)/fpKeyframe);
		
		// keyframe = [0, n-1]
		return count % n;
		
	}
	
	var keyframe = getKeyframe(frameCount);

	var xValArr = [];
	var yValArr = [];
	for (var i = 0; i < this.vertices.length; i++) {
		var vertex = this.vertices[i];
		xValArr.push(vertex.x + keyframe*(xFinalArr[i]-vertex.x)/(n-1));
		yValArr.push(vertex.y + keyframe*(yFinalArr[i]-vertex.y)/(n-1));
	}

	for (var i = 0; i < newCurve.vertices.length; i++){
		newCurve.vertices[i].x = xValArr[i];
		newCurve.vertices[i].y = yValArr[i];
	}
	
	return newCurve;
	
}

Curve.prototype.showVertices = function() {
	
	for (var i = 0; i < this.vertices.length; i++) {
			// add circles marking vertices
			push();
			if (i > 0 && i < this.vertices.length-1){
				ellipse(this.vertices[i].x, this.vertices[i].y, 8, 8);
			}
			pop();
		}
		
		// add circles marking control points with different style
		push();
		fill(255, 0, 0);
		var controlPoint1 = this.vertices[0];
		var controlPoint2 = this.vertices[this.vertices.length-1];
		ellipse(controlPoint1.x, controlPoint1.y, 8, 8);
		ellipse(controlPoint2.x, controlPoint2.y, 8, 8);
		pop();
	
}

// arguments: (showVertices: bool - should vertices be displayed?)
Curve.prototype.render = function(showVertices) {
	
	if (this.needsUpdate) {
		this.updateVertices();
	}
	
	noFill();
	beginShape();
	
	// control points included as curve vertices
	for (var i = 0; i < this.vertices.length; i++) {
		curveVertex(this.vertices[i].x, this.vertices[i].y);
	}
	
	if (showVertices) {
		this.showVertices();
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
