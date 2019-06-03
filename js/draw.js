/* jshint browser: true, module: true, esversion: 8 */

/*
i experimented with different ways to convert the image data to a string:

1) coordinates of end points of drawn lines joined with separator characters
2) the full image data as one character for each pixel

strings from 2 are of course about 1000 times longer than strings from 1, and
that was still true after compressing with lzstring, with almost nothing drawn
on the canvas and with lots of stuff drawn
*/

import EventEmitter from "events";

const xyFromEvent = event => {
  // there are two properties that give correct values, one is
  // "experimental" and the other is "non-standard", so i chose the
  // experimental property
  // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/offsetX
  // https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/layerX
  return [event.offsetX, event.offsetY];
};

class DrawObject {
  constructor(parent) {
    this.parent = parent;
  }

  draw() {}

  onMouseMove() {}

  onMouseUp() {}

  toStringPart() {}

  static fromStringPart(parent, stringPart) {}
}

class Line extends DrawObject {
  constructor(parent, points) {
    super(parent);

    if (!Array.isArray(points) || points.length === 0) throw new Error("invalid line input");

    // points: [[x, y]]
    if (Array.isArray(points[0])) {
      this.points = points;
    // startPoint: [x, y]
    } else {
      this.points = [points];
    }
  }

  draw() {
    if (this.points.length >= 2) {
      this.parent.ctx.beginPath();
      this.parent.ctx.moveTo(...(this.points[0]));
      for (const xy of this.points.slice(1)) {
        this.parent.ctx.lineTo(...xy);
      }
      this.parent.ctx.stroke();
    }
  }

  onMouseMove(xy) {
    this.points.push(xy);

    // draw the new component without redrawing everything else
    this.parent.ctx.beginPath();
    this.parent.ctx.moveTo(...(this.points[this.points.length - 2]));
    this.parent.ctx.lineTo(...(this.points[this.points.length - 1]));
    this.parent.ctx.stroke();

    this.parent.emit("change");
  }

  // like 'x1,y1;x2,y2;...' where xs and ys are integers
  toStringPart() {
    return this.points.map(xy => xy.join(',')).join(';');
  }

  static fromStringPart(parent, stringPart) {
    return new Line(parent, stringPart.split(';').map(xy => xy.split(',').map(value => +value)));
  }
}

class TwoPointLine extends Line {
  constructor(parent, point) {
    super(parent, [point]);
    this._mouseMoveImageData = null;
  }

  onMouseMove(xy) {
    // there seems to be no easy way to delete an already drawn circle from
    // the canvas, so image data tricks are the best i can do
    if (this._mouseMoveImageData === null) {
      this._mouseMoveImageData = this.parent.ctx.getImageData(0, 0, this.parent.canvas.width, this.parent.canvas.height);
    } else {
      this.parent.ctx.clearRect(0, 0, this.parent.canvas.width, this.parent.canvas.height);
      this.parent.ctx.putImageData(this._mouseMoveImageData, 0, 0);
    }

    if (this.points.length === 1) {
      this.points.push(xy);
    } else if (this.points.length === 2) {
      this.points[1] = xy;
    } else {
      throw new Error("the TwoPointLine is in an inconsistent state");
    }

    this.draw();
  }

  onMouseUp() {
    super.onMouseUp();
    this._mouseMoveImageData = null; // to avoid memory leaking
  }
}

class Circle extends DrawObject {
  constructor(parent, center, radius, filled) {
    super(parent);

    this.center = center;
    this.radius = radius || 0;
    this.filled = filled || false;
    this._mouseMoveImageData = null;
  }

  draw() {
    this.parent.ctx.beginPath();
    this.parent.ctx.arc(...this.center, this.radius, 0, 2 * Math.PI);
    if (this.filled) {
      this.parent.ctx.fill();
    } else {
      this.parent.ctx.stroke();
    }
    this.parent.emit("change");
  }

  onMouseMove(xy) {
    if (this._mouseMoveImageData === null) {
      this._mouseMoveImageData = this.parent.ctx.getImageData(0, 0, this.parent.canvas.width, this.parent.canvas.height);
    } else {
      this.parent.ctx.clearRect(0, 0, this.parent.ctx.width, this.parent.canvas.height);
      this.parent.ctx.putImageData(this._mouseMoveImageData, 0, 0);
    }

    this.radius = Math.round(Math.hypot(this.center[0] - xy[0], this.center[1] - xy[1]));
    this.draw();
  }

  onMouseUp() {
    this._mouseMoveImageData = null;
  }

  // 'circle;x;y;r;1' is a filled circle centered at (x,y) with radius r
  // 'circle;x;y;r;0' is an open circle centered at (x,y) with radius r
  // x, y and r are integers
  toStringPart() {
    return 'circle;' + this.center.join(';') + ';' + this.radius + ';' + (+!!this.filled);
  }

  static fromStringPart(parent, stringPart) {
    const [circleString, centerX, centerY, radius, isFilled] = stringPart.split(';');
    if (circleString !== 'circle') {
      throw new Error("does not look like a circle string part: " + stringPart);
    }
    return new Circle(parent, [+centerX, +centerY], +radius, !!(+isFilled));
  }
}

export default class CanvasManager extends EventEmitter {
  constructor() {
    super();

    this.canvas = document.getElementById("draw-canvas");
    this.ctx = this.canvas.getContext("2d");

    this.objects = [];
    this.currentDrawObject = null;
    this.currentlyDrawing = null;

    this._createButtons({
      "pen": Line,
      "circle": Circle,
      "line": TwoPointLine,
    });

    this._registerEventHandlers();
  }

  _registerEventHandlers() {
    let mouseIsBeingDragged = false;

    this.canvas.addEventListener("mousedown", event => {
      if (!this.currentDrawObject) return;

      mouseIsBeingDragged = false;

      let clickPoint = xyFromEvent(event);

      this.currentlyDrawing = new this.currentDrawObject(this, clickPoint);

      this.emit("change");

      event.preventDefault(); // prevent e.g. selecting some text, that's annoying
    });

    this.canvas.addEventListener('mousemove', event => {
      if (this.currentlyDrawing === null) return;
      mouseIsBeingDragged = true;
      this.currentlyDrawing.onMouseMove(xyFromEvent(event));
    });

    // document because mouse up outside canvas must also stop drawing
    document.addEventListener('mouseup', event => {
      if (this.currentlyDrawing === null) return;
      this.currentlyDrawing.onMouseUp();

      // XXX: what is this code doing ..?
      if (mouseIsBeingDragged) {
        this.objects.push(this.currentlyDrawing);
      } else {
        const circle = new Circle(xyFromEvent(event), 3, true);
        circle.draw();
        this.objects.push(circle);
      }
      this.currentlyDrawing = null;

      this.emit("change");
    });

  }

  _createButtons(types) {
    const buttons = [];

    for (const [type, cls] of Object.entries(types)) {
      const elementId = `draw-${type}-button`;
      const element = document.getElementById(elementId);

      element.addEventListener("click", () => {
        buttons.forEach(element => element.classList.remove("selected"));
      });

      element.addEventListener("click", () => {
        element.classList.add("selected");
        this.currentDrawObject = cls;
      });

      buttons.push(element);
    }
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const object of this.objects) {
      object.draw();
    }
    this.emit("change");
  }

  getImageString() {
    const stringParts = [];
    for (const object of this.objects) {
      stringParts.push(object.toStringPart());
    }
    return stringParts.join('|');
  }

  setImageString(imageString) {
    this.objects = [];

    if (!imageString) return;

    if (imageString.length !== 0) { // ''.split('|') is [''], which screws up everything
      for (const stringPart of imageString.split('|')) {
        if (stringPart.startsWith('circle;')) {
          this.objects.push(Circle.fromStringPart(this, stringPart));
        } else {
          this.objects.push(Line.fromStringPart(this, stringPart));
        }
      }
    }
    this.redraw();
  }

  getDataUrl() {
    return this.canvas.toDataURL();
  }

  undo() {
    if (this.objects.length !== 0 && this.currentlyDrawing === null) {
      this.objects.pop();
      this.redraw();
    }
  }
}
