/*
i experimented with different ways to convert the image data to a string:

1) coordinates of end points of drawn lines joined with separator characters
2) the full image data as one character for each pixel

strings from 2 are of course about 1000 times longer than strings from 1, and
that was still true after compressing with lzstring, with almost nothing drawn
on the canvas and with lots of stuff drawn
*/

import { RadioClassManager, StrictEventEmitter, xyFromEvent } from "./utils";
import { Pen } from "./drawobjects/pen";
import { Circle } from "./drawobjects/circle";

import { Point, LineMode, DrawObject } from "./drawobjects/drawobject";

interface CanvasManagerEvents {
  change: () => void;
}

type Buttons = Record<string, (point: Point) => DrawObject>;

export class CanvasManager extends StrictEventEmitter<CanvasManagerEvents>() {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  readOnly: boolean = false;

  objects: DrawObject[] = [];
  drawing: boolean = false;

  private currentDrawObjectFactory: ((point: Point) => DrawObject) | null = null;
  private selectedManager: RadioClassManager = new RadioClassManager("selected");

  private imageData: ImageData | null = null;

  constructor(canvasId: string) {
    super();

    this.canvas = document.getElementById(canvasId)! as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;

    this.registerEventHandlers();
  }

  createButtons<B extends Buttons>(buttons: B): Record<keyof B, HTMLButtonElement> {
    const result = {} as Record<string, HTMLButtonElement>;

    for (const [type, factory] of Object.entries(buttons)) {
      result[type] = this.createButton(type, factory);
    }

    return result as Record<keyof B, HTMLButtonElement>;
  }

  private registerEventHandlers() {
    let mouseMoved = false;

    this.canvas.addEventListener("mousedown", event => {
      event.preventDefault();

      if (this.readOnly) return;

      mouseMoved = false;

      if (this.currentDrawObjectFactory === null) return;
      this.drawing = true;
      this.objects.push(this.currentDrawObjectFactory(xyFromEvent(event)));
    });

    this.canvas.addEventListener("mousemove", event => {
      if (!this.drawing) return;

      mouseMoved = true;
      this.objects[this.objects.length - 1].onMouseMove(xyFromEvent(event));
      this.draw(this.objects[this.objects.length - 1]);
    });

    // document because mouse up outside canvas must also stop drawing
    document.addEventListener("mouseup", event => {
      if (this.readOnly) return;

      // Draw a vertex instead of empty stuff.
      if (!mouseMoved) {
        if (this.drawing) this.objects.pop();
        const vertex = new Circle(xyFromEvent(event), true, 2);
        this.objects.push(vertex);
        this.draw(vertex);
      }

      this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

      this.drawing = false;
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
      case LineMode.Fill:
        this.ctx.fill(obj.path);
        break;

      case LineMode.Stroke:
        this.ctx.stroke(obj.path);
        break;
    }

    this.emit("change");
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.imageData = null;
    this.objects.forEach(obj => this.draw(obj));

    this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  undo() {
    if (this.objects.length === 0) return;

    this.objects.pop();
    this.redraw();
    this.drawing = false;
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
