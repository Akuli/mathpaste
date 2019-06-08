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

import { Point, DrawObject } from "./drawobjects/drawobject";
import { Pen, StraightLine } from "./drawobjects/pen";
import { Circle } from "./drawobjects/circle";

export class CanvasManager extends EventEmitter {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  readOnly: boolean = false;

  objects: DrawObject[] = [];

  currentlyDrawing: DrawObject | null = null;

  private currentDrawObjectFactory: ((point: Point) => DrawObject) | null = null;
  private selectedManager: RadioClassManager = new RadioClassManager("selected");

  private imageData: ImageData | null = null;

  constructor(canvasId: string) {
    super();

    this.canvas = document.getElementById(canvasId)! as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;

    this.createButton("pen", p => new Pen(p)).click();
    this.createButton("circle", p => new Circle(p));
    this.createButton("filled-circle", p => {
      const circle = new Circle(p);
      circle.lineMode = "fill";
      return circle;
    });
    this.createButton("line", p => new StraightLine(p));

    this.registerEventHandlers();
  }

  private registerEventHandlers() {
    let mouseMoved = false;

    this.canvas.addEventListener("mousedown", event => {
      event.preventDefault(); // prevent e.g. selecting some text, that's annoying

      if (this.readOnly) return;

      mouseMoved = false;

      if (this.currentDrawObjectFactory === null) return;
      this.currentlyDrawing = this.currentDrawObjectFactory(xyFromEvent(event));
    });

    this.canvas.addEventListener("mousemove", event => {
      mouseMoved = true;

      if (this.currentlyDrawing === null) return;
      this.currentlyDrawing.onMouseMove(xyFromEvent(event));
      this.draw(this.currentlyDrawing);
    });

    // document because mouse up outside canvas must also stop drawing
    document.addEventListener("mouseup", event => {
      if (this.readOnly) return;

      if (mouseMoved && this.currentlyDrawing !== null &&
          !(this.currentlyDrawing instanceof Pen && this.currentlyDrawing.points.length === 0)) {
        this.currentlyDrawing.onMouseUp();
        this.objects.push(this.currentlyDrawing);
      } else {
        const vertex = new Circle(xyFromEvent(event), true, 2);
        this.objects.push(vertex);
      }

      this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

      this.currentlyDrawing = null;

      this.emit("change");
    });

  }

  private createButton(type: string, factory: (point: Point) => DrawObject): HTMLButtonElement {
    const elementId = `draw-${type}-button`;
    const element = document.getElementById(elementId)! as HTMLButtonElement;

    element.addEventListener("mouseup", event => event.stopPropagation());

    element.addEventListener("click", () => {
      this.selectedManager.addClass(element);
      this.currentDrawObjectFactory = factory;
    });

    return element;
  }

  draw(obj: DrawObject) {
    if (this.imageData !== null) this.ctx.putImageData(this.imageData, 0, 0);

    switch (obj.lineMode) {
      case "fill":
        this.ctx.fill(obj.path);
        break;

      case "stroke":
        this.ctx.stroke(obj.path);
        break;
    }

    this.emit("change");
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.objects.forEach(obj => {
      this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.draw(obj)
    });
  }

  undo() {
    if (this.objects.length === 0) return;
    if (this.currentlyDrawing !== null) return;

    this.objects.pop();
    this.redraw();
  }

  getImageString() {
    return this.objects.map(object => object.toStringPart()).join("|");
  }

  setImageString(imageString: string) {
    if (imageString === "") return;

    this.objects = imageString.split("|").map(stringPart => {
      if (stringPart.startsWith("circle;")) {
        return Circle.fromStringPart(stringPart);
      } else {
        return Pen.fromStringPart(stringPart);
      }
    });

    this.redraw();
  }

  getDataUrl() {
    return this.canvas.toDataURL();
  }
}
