class Point {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z || 0;
    }
}

class Line {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
}

class Transform {
    constructor() {
        this.tx = 0;
        this.ty = 0;
        this.tz = 0;
        this.sx = 1;
        this.sy = 1;
        this.sz = 1;
        this.rx = 0;
        this.ry = 0;
        this.rz = 0;
    }

    multiply(a, b) {
        let matrix = [];
        for (let i = 0; i < a.length; i++) {
            matrix[i] = [];
            for (let j = 0; j < b[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < a[0].length; k++) {
                    sum += a[i][k] * b[k][j];
                }
                matrix[i][j] = sum;
            }
        }
        return matrix;
    }

    rotateZ(angle) {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        let matrix = [
            [cos, -sin, 0, 0],
            [sin, cos, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
        return matrix;
    }

    rotateX(angle) {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        let matrix = [
            [1, 0, 0, 0],
            [0, cos, -sin, 0],
            [0, sin, cos, 0],
            [0, 0, 0, 1]
        ];
        return matrix;
    }

    rotateY(angle) {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        let matrix = [
            [cos, 0, sin, 0],
            [0, 1, 0, 0],
            [-sin, 0, cos, 0],
            [0, 0, 0, 1]
        ];
        return matrix;
    }

    translate(x, y, z) {
        this.tx = x;
        this.ty = y;
        this.tz = z;
    }

    rotate(x, y, z) {
        this.rx = x;
        this.ry = y;
        this.rz = z;
    }

    scale(x, y, z) {
        this.sx = x;
        this.sy = y;
        this.sz = z;
    }

    transform(point) {
        let vector = [
            [point.x],
            [point.y],
            [point.z],
            [1]
        ];

        let matrix = [
            [this.sx, 0, 0, this.tx],
            [0, this.sy, 0, this.ty],
            [0, 0, this.sz, this.tz],
            [0,     0,     0,     1]
        ];

        let rz = this.rotateZ(this.rz);
        let rx = this.rotateX(this.rx);
        let ry = this.rotateY(this.ry);

        matrix = this.multiply(matrix, rz);
        matrix = this.multiply(matrix, rx);
        matrix = this.multiply(matrix, ry);
        let result = this.multiply(matrix, vector);
        return new Point(result[0][0], result[1][0], result[2][0]);
    }
}

class Shape {
    constructor() {
        this.color = "#000000";
        this.points = [];
        this.t = new Transform();
    }

    addPoint(point) {
        this.points.push(point);
    }

    updateMatrix() {
        let tx = +getElementValue("tx");
        let ty = +getElementValue("ty");
        let tz = +getElementValue("tz");
        let sx = +getElementValue("sx");
        let sy = +getElementValue("sy");
        let sz = +getElementValue("sz");
        let rx = +getElementValue("rx") * 2 * Math.PI / 360;
        let ry = +getElementValue("ry") * 2 * Math.PI / 360;
        let rz = +getElementValue("rz") * 2 * Math.PI / 360;

        this.rotate(rx, ry, rz);
        this.scale(sx, sy, sz);
        this.translate(tx, ty, tz);
    }

    updateColor() {
        this.color = getElementValue("objColor");
    }

    reset() {
        this.t = new Transform();
    }

    transform(points) {
        let transformedPoints = [];
        for (let i = 0; i < points.length; i++) {
            transformedPoints.push(this.t.transform(points[i]));
        }
        return transformedPoints;
    }

    project(points) {
        const PERSPECTIVE = getElementValue("fov");
        if (getElementValue("projection") == "orthographic") return points;
        let projectedPoints = [];
        for (let i = 0; i < points.length; i++) {
            let scale = PERSPECTIVE / (PERSPECTIVE - points[i].z);
            let x = points[i].x * scale;
            let y = points[i].y * scale;
            projectedPoints.push(new Point(x, y));
        }
        return projectedPoints;
    }

    draw() {
        const CENTER_X = canvas.width / 2; // x center of the canvas
        const CENTER_Y = canvas.height / 2; // y center of the canvas
        let points = this.project(this.transform(this.points));
        ctx.beginPath();
        ctx.moveTo(CENTER_X + points[0].x, CENTER_Y - points[0].y);
        for (let i = 0; i < points.length; i++) {
            ctx.lineTo(CENTER_X + points[i].x, CENTER_Y - points[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = this.color;
        ctx.stroke();
    }

    translate(x, y, z) {
        this.t.translate(x, y, z);
        return this;
    }

    rotate(x, y, z) {
        this.t.rotate(x, y, z);
        return this;
    }

    scale(x, y, z) {
        this.t.scale(x, y, z);
        return this;
    }
}

class Shape3D extends Shape {
    constructor() {
        super();
        this.lines = [];
    }

    addLine(line) {
        this.lines.push(line);
    }

    draw() {
        const CENTER_X = canvas.width / 2; // x center of the canvas
        const CENTER_Y = canvas.height / 2; // y center of the canvas
        let points = this.project(this.transform(this.points));
        for (let i = 0; i < this.lines.length; i++) {
            let line = this.lines[i];
            ctx.beginPath();
            ctx.moveTo(CENTER_X + points[line.start].x, CENTER_Y - points[line.start].y);
            ctx.lineTo(CENTER_X + points[line.end].x, CENTER_Y - points[line.end].y);
            ctx.closePath();
            ctx.strokeStyle = this.color;
            ctx.stroke();
        }
    }
}

class Rectangle extends Shape {
    constructor(x, y, width, height) {
        super();
        this.addPoint(new Point(x + width/2, y + height/2));
        this.addPoint(new Point(x - width/2, y + height/2));
        this.addPoint(new Point(x - width/2, y - height/2));
        this.addPoint(new Point(x + width/2, y - height/2));
    }
}

class Circle extends Shape {
    constructor(x, y, radius) {
        super();
        for (let i = 0; i < 360; i++) {
            let angle = i * Math.PI / 180;
            let point = new Point(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
            this.addPoint(point);
        }
        this.center = new Point(x, y);
        this.radius = radius;
    }

    // draw() {
    //     ctx.beginPath();
    //     ctx.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
    //     ctx.stroke(); 
    // }
}

class Triangle extends Shape {
    constructor(x, y, width, height) {
        super();
        this.addPoint(new Point(x, y + height/2));
        this.addPoint(new Point(x - width/2, y - height/2));
        this.addPoint(new Point(x + width/2, y - height/2));
    }
}

class Qube extends Shape3D {
    constructor(x, y, z, width, height, depth) {
        super();
        this.addPoint(new Point(x - width/2, y - height/2, z - depth/2));
        this.addPoint(new Point(x + width/2, y - height/2, z - depth/2));
        this.addPoint(new Point(x + width/2, y + height/2, z - depth/2));
        this.addPoint(new Point(x - width/2, y + height/2, z - depth/2));
        this.addPoint(new Point(x - width/2, y - height/2, z + depth/2));
        this.addPoint(new Point(x + width/2, y - height/2, z + depth/2));
        this.addPoint(new Point(x + width/2, y + height/2, z + depth/2));
        this.addPoint(new Point(x - width/2, y + height/2, z + depth/2));
        this.addLine(new Line(0, 1));
        this.addLine(new Line(1, 2));
        this.addLine(new Line(2, 3));
        this.addLine(new Line(3, 0));
        this.addLine(new Line(4, 5));
        this.addLine(new Line(5, 6));
        this.addLine(new Line(6, 7));
        this.addLine(new Line(7, 4));
        this.addLine(new Line(0, 4));
        this.addLine(new Line(1, 5));
        this.addLine(new Line(2, 6));
        this.addLine(new Line(3, 7));
    }
}

class Cylinder extends Shape3D {
    constructor(x, y, z, radius, height, res) {
        res = res || 360;
        super();
        for (let i = 0; i < res; i++) {
            let angle = 2 * i * Math.PI / res;
            let point = new Point(x + radius * Math.cos(angle), y + radius * Math.sin(angle), z - height/2);
            this.addPoint(point);
        }
        for (let i = 0; i < res; i++) {
            let angle = 2 * i * Math.PI / res;
            let point = new Point(x + radius * Math.cos(angle), y + radius * Math.sin(angle), z + height/2);
            this.addPoint(point);
        }
        for (let i = 0; i < res; i++) {
            this.addLine(new Line(i, i + res));
        }
        for (let i = 0; i < res; i++) {
            this.addLine(new Line(i, (i + 1) % res));
        }
        for (let i = 0; i < res; i++) {
            this.addLine(new Line(i + res, (i + 1) % res + res));
        }
    }
}

class Pyramid extends Shape3D {
    constructor(x, y, z, width, height, depth) {
        super();
        this.addPoint(new Point(x - width/2, y - height/2, z - depth/2));
        this.addPoint(new Point(x + width/2, y - height/2, z - depth/2));
        this.addPoint(new Point(x + width/2, y - height/2, z + depth/2));
        this.addPoint(new Point(x - width/2, y - height/2, z + depth/2));
        this.addPoint(new Point(x, y + height/2, z));
        this.addLine(new Line(0, 1));
        this.addLine(new Line(1, 2));
        this.addLine(new Line(2, 3));
        this.addLine(new Line(3, 0));
        this.addLine(new Line(0, 4));
        this.addLine(new Line(1, 4));
        this.addLine(new Line(2, 4));
        this.addLine(new Line(3, 4));
    }
}

class Sphere extends Shape3D {
    constructor(x, y, z, radius, res) {
        res = res || 36;
        super();
        for (let i = 0; i < res; i++) {
            let angle = 2 * i * Math.PI / res;
            for (let j = 0; j < res; j++) {
                let angle2 = 2 * j * Math.PI / res;
                let point = new Point(x + radius * Math.cos(angle) * Math.cos(angle2), y + radius * Math.sin(angle) * Math.cos(angle2), z + radius * Math.sin(angle2));
                this.addPoint(point);
            }
        }
        for (let i = 0; i < res; i++) {
            for (let j = 0; j < res; j++) {
                this.addLine(new Line(i * res + j, i * res + (j + 1) % res));
            }
        }
        for (let i = 0; i < res; i++) {
            for (let j = 0; j < res; j++) {
                this.addLine(new Line(i * res + j, ((i + 1) % res) * res + j));
            }
        }
    }
}

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const square = new Rectangle(0, 0, 200, 200);
const rect = new Rectangle(0, 0, 400, 100);
const circle = new Circle(0, 0, 100);
const triangle = new Triangle(0, 0, 200, 200, 200);
const qube = new Qube(0, 0, 0, 200, 200, 200);
const cylinder = new Cylinder(0, 0, 0, 100, 200, 100);
const pyramid = new Pyramid(0, 0, 0, 200, 200, 200);
const sphere = new Sphere(0, 0, 0, 100, 18);
let selectedObject = square;

function getElementValue(id) {
    return document.getElementById(id).value;
}

function getCheckboxValue(id) {
    return document.getElementById(id).checked;
}

function getSelectedObject(object) {
    document.getElementById("square").parentElement.classList.remove("active");
    document.getElementById("rect").parentElement.classList.remove("active");
    document.getElementById("circle").parentElement.classList.remove("active");
    document.getElementById("triangle").parentElement.classList.remove("active");
    document.getElementById("qube").parentElement.classList.remove("active");
    document.getElementById("cylinder").parentElement.classList.remove("active");
    document.getElementById("pyramid").parentElement.classList.remove("active");
    document.getElementById("sphere").parentElement.classList.remove("active");
    document.getElementById(object).parentElement.classList.add("active");
    document.getElementById(object).checked = true;

    switch (object) {
        case "square":
            return square;
        case "rect":
            return rect;
        case "circle":
            return circle;
        case "triangle":
            return triangle;
        case "qube":
            return qube;
        case "cylinder":
            return cylinder;
        case "pyramid":
            return pyramid;
        case "sphere":
            return sphere;
    }
}

function setSelectedObject(object) {
    selectedObject = getSelectedObject(object);
    updateToolbar();
    draw();
}

function updateToolbar() {
    document.getElementById("tx").value = selectedObject.t.tx;
    document.getElementById("ty").value = selectedObject.t.ty;
    document.getElementById("tz").value = selectedObject.t.tz;
    document.getElementById("sx").value = selectedObject.t.sx;
    document.getElementById("sy").value = selectedObject.t.sy;
    document.getElementById("sz").value = selectedObject.t.sz;
    document.getElementById("rx").value = selectedObject.t.rx * 360 / Math.PI;
    document.getElementById("ry").value = selectedObject.t.ry * 360 / Math.PI;
    document.getElementById("rz").value = selectedObject.t.rz * 360 / Math.PI;
    document.getElementById("objColor").value = selectedObject.color;
}

function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw()
}

function update() {
    selectedObject.updateMatrix();
    selectedObject.updateColor();
    draw();
}

function reset() {
    selectedObject.reset();
    updateToolbar();
    draw();
}

function draw() {
    canvas.style.backgroundColor = getElementValue("bgColor");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (getCheckboxValue("square")) {
        square.draw();
    }
    if (getCheckboxValue("rect")) {
        rect.draw();
    }
    if (getCheckboxValue("circle")) {
        circle.draw();
    }
    if (getCheckboxValue("triangle")) {
        triangle.draw();
    }
    if (getCheckboxValue("qube")) {
        qube.draw();
    }
    if (getCheckboxValue("cylinder")) {
        cylinder.draw();
    }
    if (getCheckboxValue("pyramid")) {
        pyramid.draw();
    }
    if (getCheckboxValue("sphere")) {
        sphere.draw();
    }
}


// Listen to resize events
window.addEventListener('resize', onResize);
// Make sure the canvas size is perfect
onResize();