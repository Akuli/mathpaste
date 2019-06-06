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

import { DrawObject, DrawObjectFactory, Point } from "./drawobjects/drawobject";
import Pen from "./drawobjects/pen";
import StraightLine from "./drawobjects/straightline";
import Circle from "./drawobjects/circle";

export class CanvasManager extends EventEmitter {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  readOnly: boolean = false;

  objects: DrawObject[] = [];

  currentlyDrawing: DrawObject | null = null;

  private currentDrawObject: DrawObjectFactory | null = null;
  private selectedManager: RadioClassManager = new RadioClassManager("selected");

  constructor(canvasId: string) {
    super();

    this.canvas = document.getElementById(canvasId)! as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;

    this.createButton("pen", Pen).click();
    this.createButton("circle", Circle);
    this.createButton("line", StraightLine);

    this.registerEventHandlers();
  }

  private registerEventHandlers() {
    let mouseMoved = false;

    this.canvas.addEventListener("mousedown", event => {
      event.preventDefault(); // prevent e.g. selecting some text, that's annoying

      if (this.readOnly) return;

      mouseMoved = false;

      if (this.currentDrawObject === null) return;
      this.currentlyDrawing = new this.currentDrawObject(this, xyFromEvent(event));
    });

    this.canvas.addEventListener("mousemove", event => {
      mouseMoved = true;

      if (this.currentlyDrawing === null) return;
      this.currentlyDrawing.onMouseMove(xyFromEvent(event));
    });

    // document because mouse up outside canvas must also stop drawing
    document.addEventListener("mouseup", event => {
      if (this.readOnly) return;

      if (mouseMoved && this.currentlyDrawing !== null &&
          !(this.currentlyDrawing instanceof Pen && this.currentlyDrawing.points.length === 0)) {
        this.currentlyDrawing.onMouseUp();
        this.objects.push(this.currentlyDrawing);
      } else {
        const point = new Circle(this, xyFromEvent(event));
        point.filled = true;
        point.radius = 2;
        point.draw();
        this.objects.push(point);
      }

      this.currentlyDrawing = null;

      this.emit("change");
    });

  }

  private createButton(type: string, cls: DrawObjectFactory): HTMLButtonElement {
    const elementId = `draw-${type}-button`;
    const element = document.getElementById(elementId)! as HTMLButtonElement;

    element.addEventListener("mouseup", event => event.stopPropagation());

    element.addEventListener("click", () => {
      this.selectedManager.addClass(element);
      this.currentDrawObject = cls;
    });

    return element;
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
      if (stringPart.startsWith("circle;")) {
        return Circle.fromStringPart(this, stringPart);
      } else {
        return Pen.fromStringPart(this, stringPart);
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
