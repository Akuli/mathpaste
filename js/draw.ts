/*
i experimented with different ways to convert the image data to a string:

1) coordinates of end points of drawn lines joined with separator characters
2) the full image data as one character for each pixel

strings from 2 are of course about 1000 times longer than strings from 1, and
that was still true after compressing with lzstring, with almost nothing drawn
on the canvas and with lots of stuff drawn
*/

import { EventEmitter } from "events";

import { RadioClassManager, xyFromEvent } from "./utils";

type Point = [number, number];

abstract class DrawObject {
  constructor(public parent: CanvasManager) {}

  get canvas() { return this.parent.canvas; }
  get ctx() { return this.parent.ctx; }

  abstract draw(): void;

  abstract onMouseMove(xy: Point): void;

  abstract onMouseUp(): void;

  abstract toStringPart(): string;
}

interface DrawObjectFactory {
  new(parent: CanvasManager, point: Point): DrawObject;

  fromStringPart(parent: CanvasManager, stringPart: string): DrawObject;
}

class Line extends DrawObject {
  points: Point[];

  constructor(public parent: CanvasManager, points: Point[] | Point) {
    super(parent);

    if (Array.isArray(points[0])) {
      this.points = points as Point[];
    } else {
      this.points = [points as Point];
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

  onMouseMove(xy: Point) {
    this.points.push(xy);

    // draw the new component without redrawing everything else
    this.parent.ctx.beginPath();
    this.parent.ctx.moveTo(...(this.points[this.points.length - 2]));
    this.parent.ctx.lineTo(...(this.points[this.points.length - 1]));
    this.parent.ctx.stroke();

    this.parent.emit("change");
  }

  onMouseUp() {}

  // like 'x1,y1;x2,y2;...' where xs and ys are integers
  toStringPart() {
    return this.points.map(xy => xy.join(',')).join(';');
  }

  static fromStringPart(parent: CanvasManager, stringPart: string): DrawObject {
    return new Line(parent, stringPart.split(';').map(xy => xy.split(',').map(value => +value)) as Point[]);
  }
}

class TwoPointLine extends Line {
  private mouseMoveImageData: ImageData | null = null;

  onMouseMove(xy: Point) {
    // there seems to be no easy way to delete an already drawn circle from
    // the canvas, so image data tricks are the best i can do
    if (this.mouseMoveImageData === null) {
      this.mouseMoveImageData = this.parent.ctx.getImageData(0, 0, this.parent.canvas.width, this.parent.canvas.height);
    } else {
      this.parent.ctx.clearRect(0, 0, this.parent.canvas.width, this.parent.canvas.height);
      this.parent.ctx.putImageData(this.mouseMoveImageData, 0, 0);
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
    this.mouseMoveImageData = null; // to avoid memory leaking
  }
}

class Circle extends DrawObject {
  private mouseMoveImageData: ImageData | null = null;

  public radius: number = 0;
  public filled: boolean = false;

  constructor(parent: CanvasManager, public center: Point) { super(parent); }

  draw() {
    this.parent.ctx.beginPath();
    this.parent.ctx.arc(this.center[0], this.center[1], this.radius, 0, 2 * Math.PI);
    if (this.filled) {
      this.parent.ctx.fill();
    } else {
      this.parent.ctx.stroke();
    }
    this.parent.emit("change");
  }

  onMouseMove(xy: Point) {
    if (this.mouseMoveImageData === null) {
      this.mouseMoveImageData = this.parent.ctx.getImageData(0, 0, this.parent.canvas.width, this.parent.canvas.height);
    } else {
      this.parent.ctx.clearRect(0, 0, this.parent.canvas.width, this.parent.canvas.height);
      this.parent.ctx.putImageData(this.mouseMoveImageData, 0, 0);
    }

    this.radius = Math.round(Math.hypot(this.center[0] - xy[0], this.center[1] - xy[1]));
    this.draw();
  }

  onMouseUp() {
    this.mouseMoveImageData = null;
  }

  // 'circle;x;y;r;1' is a filled circle centered at (x,y) with radius r
  // 'circle;x;y;r;0' is an open circle centered at (x,y) with radius r
  // x, y and r are integers
  toStringPart() {
    return 'circle;' + this.center.join(';') + ';' + this.radius + ';' + (+!!this.filled);
  }

  static fromStringPart(parent: CanvasManager, stringPart: string): DrawObject {
    const [circleString, centerX, centerY, radius, isFilled] = stringPart.split(';');
    if (circleString !== "circle") {
      throw new Error("does not look like a circle string part: " + stringPart);
    }

    const circle = new Circle(parent, [+centerX, +centerY])
    circle.radius = +radius;
    circle.filled = !!+isFilled;
    return circle;
  }
}

export default class CanvasManager extends EventEmitter {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  readOnly: boolean;

  objects: DrawObject[];

  currentlyDrawing: DrawObject | null;

  private currentDrawObject: DrawObjectFactory | null;
  private selectedManager: RadioClassManager;

  constructor() {
    super();

    this.canvas = document.getElementById("draw-canvas")! as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;

    this.objects = [];

    this.currentDrawObject = null;
    this.currentlyDrawing = null;

    this.selectedManager = new RadioClassManager("selected");

    this.readOnly = false;

    this.createButtons({
      "pen": Line,
      "circle": Circle,
      "line": TwoPointLine,
    });

    this.registerEventHandlers();
  }

  private registerEventHandlers() {
    this.canvas.addEventListener("mousedown", event => {
      if (this.readOnly) return;
      if (this.currentDrawObject === null) return;

      let clickPoint = xyFromEvent(event);

      this.currentlyDrawing = new this.currentDrawObject(this, clickPoint);

      this.emit("change");

      event.preventDefault(); // prevent e.g. selecting some text, that's annoying
    });

    this.canvas.addEventListener("mousemove", event => {
      if (this.currentlyDrawing === null) return;
      this.currentlyDrawing.onMouseMove(xyFromEvent(event));
    });

    // document because mouse up outside canvas must also stop drawing
    document.addEventListener("mouseup", () => {
      if (this.currentlyDrawing === null) return;
      this.currentlyDrawing.onMouseUp();

      this.objects.push(this.currentlyDrawing);
      this.currentlyDrawing = null;

      this.emit("change");
    });

  }

  private createButtons(types: { [key: string]: DrawObjectFactory }) {
    for (const [type, cls] of Object.entries(types)) {
      const elementId = `draw-${type}-button`;
      const element = document.getElementById(elementId)!;

      element.addEventListener("click", () => {
        this.selectedManager.addClass(element);
        this.currentDrawObject = cls;
      });
    }
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.objects.forEach(object => object.draw());
    this.emit("change");
  }

  getImageString() {
    return this.objects.map(object => object.toStringPart()).join("|");
  }

  setImageString(imageString: string) {
    if (imageString === "") return;

    this.objects = imageString.split("|").map(stringPart => {
      if (stringPart.startsWith('circle;')) {
        return Circle.fromStringPart(this, stringPart);
      } else {
        return Line.fromStringPart(this, stringPart);
      }
    });

    this.redraw();
  }

  getDataUrl() {
    return this.canvas.toDataURL();
  }

  undo() {
    if (this.objects.length === 0) return;
    if (this.currentlyDrawing !== null) return;

    this.objects.pop();
    this.redraw();
  }
}
