w = 800;
h = 800;
seed = Date.now();
//seed = 1600379579447;

const offset = 1000;
const perlinScale2 = .5;
const pscale = {x: 1, y: 1};
const openSimplex = openSimplexNoise(seed);
const chunks = 6;
const perlinScale = .008;
const fieldAngle = 1;
const spacing = 30;
const steps = 30;
const stepDist = 3;


console.log(seed);


function getDistance(x1, y1, x2, y2) {
	
	let xs = x2 - x1,
		ys = y2 - y1;		
	
	xs *= xs;
	ys *= ys;
	 
	return Math.sqrt( xs + ys );
};

function inside(point, vs) {  
    var x = point[0], y = point[1];
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];
        
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

function checkCircles(x, y, circles, r) {
	for (let k = 0; k < circles.length; k++) {
		if (getDistance(circles[k][0], circles[k][1], x, y) < circles[k][2] + r) {
			return false;
		}
	}
	return true;
}

function packCircles(circles, radius, count, colors, startx, starty, wide, high, polygon){
	let bandwidth = w / colors.length;
	for (let i = 0; i < count; i++) {
		let x = Math.floor(random() * wide + startx),
			y = Math.floor(random() * high + starty);
		if (checkCircles(x, y, circles, radius) == false) {
			continue;
		}
		if (polygon.length > 0) {
			if (inside([x,y], polygon) == false) {
				continue;
			}
		}
		mycolor = colors[Math.floor(random()*colors.length)];

		circles.push([x, y, radius, mycolor]);
	}
}


function toXY(xoff, yoff, r, theta) {
	let x1 = r * cos(theta);
  	let y1 = r * sin(theta);
  	return {x: x1 + xoff, y: y1 + yoff};
}


function initField(xsize, ysize, scale, chunks, fieldAngle) {
	let field = [];
	for (let x = 0; x < xsize; x++) {
		tf = []
		for (let y = 0; y < xsize; y++) {
			tf.push(Math.floor(openSimplex.noise2D(x*scale, y*scale)*chunks) / chunks * fieldAngle);
		}
		field.push(tf.slice());
	}
	return field;
}



function drawLinesT(coordinates, colors, lineLimit) {
	stroke(colors);
	for (let i = 0; i < coordinates.length; i += 1) {
		if (getDistance(coordinates[i][0][0], coordinates[i][0][1], coordinates[i][1][0], coordinates[i][1][1]) < lineLimit &&
			getDistance(coordinates[i][1][0], coordinates[i][1][1], coordinates[i][2][0], coordinates[i][2][1]) < lineLimit &&
			getDistance(coordinates[i][2][0], coordinates[i][2][1], coordinates[i][0][0], coordinates[i][0][1]) < lineLimit) {
				triangle(coordinates[i][0][0], coordinates[i][0][1],
						 coordinates[i][1][0], coordinates[i][1][1],
						 coordinates[i][2][0], coordinates[i][2][1]);
		}
	}
}


function drawLinesC(coordinates, colors, colors2, lineLimit) {
	for (let i = 0; i < coordinates.length; i += 1) {
		let rowIndex = int(coordinates[i][0][0]/pscale.x) + offset;
		let columnIndex = int(coordinates[i][0][1]/pscale.y) + offset;
		let ang = field[rowIndex][columnIndex];
		stroke(colors[Math.floor(random()*colors.length)]);
		if (random() > .9) {
			fill(colors2[Math.floor(random()*colors2.length)]);
		} else {
			fill('white');
		}
		if (getDistance(coordinates[i][0][0], coordinates[i][0][1], coordinates[i][1][0], coordinates[i][1][1]) < lineLimit &&
			getDistance(coordinates[i][1][0], coordinates[i][1][1], coordinates[i][2][0], coordinates[i][2][1]) < lineLimit &&
			getDistance(coordinates[i][2][0], coordinates[i][2][1], coordinates[i][0][0], coordinates[i][0][1]) < lineLimit) {
				beginShape();
				curveVertex(coordinates[i][2][0], coordinates[i][2][1]);
				curveVertex(coordinates[i][0][0], coordinates[i][0][1]);
				curveVertex(coordinates[i][1][0], coordinates[i][1][1]);
				curveVertex(coordinates[i][2][0], coordinates[i][2][1]);
				curveVertex(coordinates[i][0][0], coordinates[i][0][1]);
				endShape();
		}
	}
}


function drawLinesL(circles, colors, steps) {
	stroke(colors);
	for (let i = 0; i < circles.length; i += 1) {
		let x = circles[i][0];
		let y = circles[i][1];
		for (let j = 0; j < steps; j++) {
			let rowIndex = int(x/pscale.x) + offset;
			let columnIndex = int(y/pscale.y) + offset;
			let ang = field[rowIndex][columnIndex];
			let xy = toXY(x, y, random()*stepDist, ang);
			line(x, y, xy.x, xy.y);
			x = xy.x;
			y = xy.y;
		}
	}
}


function makePoints(trianglePoints, circles, steps, stepDistance) {
	for (let i = 0; i < circles.length; i++) {
		let x = circles[i][0];
		let y = circles[i][1];
		if (random() > .5) {
			var shift = 0;
		} else {
			var shift = Math.PI;
		}
		for (let j = 0; j < steps; j++) {
			let rowIndex = int(x/pscale.x) + offset;
			let columnIndex = int(y/pscale.y) + offset;
			let ang = field[rowIndex][columnIndex];
			if (random()>.7) {
				ang *= Math.PI;
			}
			let xy = toXY(x, y, random()*stepDistance, ang);
			if (xy.y > h || xy.x > w) {break}
			trianglePoints.push([x, y]);
			x = xy.x;
			y = xy.y;
		}
	}
}


function toCoords(delaunay, coordinates, trianglePoints) {
	for (let i = 0; i < delaunay.triangles.length; i += 3) {
	    coordinates.push([
	        trianglePoints[delaunay.triangles[i]],
	        trianglePoints[delaunay.triangles[i + 1]],
	        trianglePoints[delaunay.triangles[i + 2]]
	    ]);
	}		
}


function setup() {
	setAttributes('antialias', true);
	smooth();
	createCanvas(w+200, h+200);
	noLoop();
	randomSeed(seed);

	colorMode(HSB);
	background('#ffffff');

	colors = [
			 [color(200, 100, 0, 1),
			  color(200, 80, 40, .7),
			  color(200, 80, 40, .7),
			  color(0, 20, 50, 1),
			  color(200, 30, 60, .7)], 

		 	 [color(210, 40, 25, .9),
		 	  color(210, 40, 65, .7),
		 	  color(210, 40, 65, .7),
		 	  color(210, 40, 75, .7)],

			 [color(215, 20, 85, .7),
		 	  color(215, 20, 85, .7),
		 	  color(215, 20, 85, .7),
		 	  color(215, 20, 85, .7),
		 	  color(215, 20, 85, .7),
		 	  color(215, 20, 85, .7),
		 	  color(215, 20, 85, .7),
		 	  color(215, 20, 85, .7),
		 	  color(215, 20, 85, .7),
		 	  color(0, 20, 98, 1),
		 	  color(200, 30, 95, 1),
		 	  color(210, 40, 65, .9),
		 	  color(210, 40, 65, .9)],

		 	 [color(200, 30, 95, 1),
		 	  color(200, 12, 99, 1),
		 	  color(200, 12, 99, 1),
		 	  color(200, 12, 99, 1),
		 	  color(200, 12, 99, 1),
		 	  color(200, 12, 99, 1),
		 	  color(200, 12, 99, 1),
		 	  color(300, 15, 98, 1),
		 	  color(0, 20, 98, 1)],

		 	 [color(100, 50, 50, 1),
		 	  color(200, 0, 50, 1),
		 	  color(300, 50, 50, 1),
		 	  color(0, 20, 50, 1)
		 	  ],

		 	  [color(100, 50, 65, 1),
		 	  color(200, 0, 65, 1),
		 	  color(300, 50, 65, 1),
		 	  color(0, 20, 65, 1)
		 	  ],

		 	  [color(100, 50, 85, 1),
		 	  color(200, 0, 85, 1),
		 	  color(300, 45, 90, 1),
		 	  color(0, 20, 85, 1)
		 	  ]
		 	 ];

	circles = [];
	circles2 = [];
	circles3 = [];
	circles4 = []

	polygon1 = [
			  [0, h*.58],
			  [w, h*.85],
			  [w, h],
			  [0, h]
			  ];

	polygon2 = [
			  [0, h*.70],
			  [w, h*.60],
			  [w, h],
			  [0, h]
			  ];

	polygon3 = [];

	polygon4 = [];

	field = initField(w/pscale.x + offset*2, h/pscale.y + offset*2, perlinScale, chunks, fieldAngle);
	//packCircles(circles, 100, 1, colors[0], 0, h*.75, w, h*.25, polygon);
	packCircles(circles, 40, 30, colors[0], 0, h*.55, w, h*.45, polygon1);
	packCircles(circles, 10, 2500, colors[0], 0, h*.55, w, h*.45, polygon1);
	packCircles(circles2, 36, 6, colors[0], 0, h*.5, w, h*.5, polygon2);
	packCircles(circles2, 7, 4000, colors[0], 0, h*.5, w, h*.5, polygon2);
	//packCircles(circles3, 40, 90, colors[0], 0, h*.52, w, h*.48, polygon);
	packCircles(circles3, 6, 6000, colors[0], 0, h*.52, w, h*.48, polygon3);
	//packCircles(circles4, 90, 1, colors[0], 260, 387, 5, 5, polygon2);
	packCircles(circles4, 90, 3, colors[0], 0, 0, w, h, polygon4);
	packCircles(circles4, 70, 6, colors[0], 0, 0, w, h, polygon4);
	packCircles(circles4, 50, 9, colors[0], 0, 0, w, h, polygon4);
	circles4.push([w*.225, h*.27, 80]);
	circles4.push([w*.9, h*.35, 35]);
	packCircles(circles4, 5, 20000, colors[0], 0, 0, w, h, polygon4);
}


function draw() {

	translate(100, 100);

	var trianglePoints = [];
	var trianglePoints2 = [];
	var trianglePoints3 = [];
	var trianglePoints4 = [];

	makePoints(trianglePoints, circles, 50, 3);
	makePoints(trianglePoints2, circles2, 40, 3);
	makePoints(trianglePoints3, circles3, 30, 3);
	makePoints(trianglePoints4, circles4, 30, 3);

	const delaunay = Delaunator.from(trianglePoints);
	const delaunay2 = Delaunator.from(trianglePoints2);
	const delaunay3 = Delaunator.from(trianglePoints3);
	const delaunay4 = Delaunator.from(trianglePoints4);

	var coordinates = [];
	var coordinates2 = [];
	var coordinates3 = [];
	var coordinates4 = [];

	toCoords(delaunay, coordinates, trianglePoints);
	toCoords(delaunay2, coordinates2, trianglePoints2);
	toCoords(delaunay3, coordinates3, trianglePoints3);
	toCoords(delaunay4, coordinates4, trianglePoints4);

	noFill();

	drawLinesC(coordinates4, colors[3], [color('white')], 50);
	fill(color('#ffffff'));
	drawLinesC(coordinates3, colors[2], /*[color('white')]*/colors[6], 50);
	fill(color('#ffffff'));
	drawLinesC(coordinates2, colors[1], /*[color('white')]*/colors[5], 50);
	fill(color('#ffffff'));
	drawLinesC(coordinates, colors[0], /*[color('white')]*/colors[4], 80);

	
}