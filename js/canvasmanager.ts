import { RadioClassManager, StrictEventEmitter } from "./utils";
import { Pen } from "./drawobjects/pen";
import { Circle } from "./drawobjects/circle";

import { Point, LineMode, DrawObject } from "./drawobjects/drawobject";

interface CanvasManagerEvents {
  /*
   * NB: this event is emitted only when the user changes something, not when
   * the image string is set
   */
  change: () => void;
}

interface Event {
  undo: (cm: CanvasManager) => void;
}

class DrawEvent implements Event {
  undo(cm: CanvasManager): void {
    console.assert(cm.objects.length !== 0, "undoing draw with empty objects");
    cm.objects.pop();
  }
}

class ClearEvent implements Event {
  constructor(private objects: DrawObject[]) { }

  undo(cm: CanvasManager): void {
    console.assert(cm.objects.length === 0, "undoing clear without empty objects");
    cm.objects = this.objects;
  }
}

type Tool = (point: Point, color: string) => DrawObject;
type ToolButtonSpec = Record<string, Tool>;

export class CanvasManager extends StrictEventEmitter<CanvasManagerEvents>() {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  readOnly: boolean = false;

  objects: DrawObject[] = [];

  private events: Event[] = [];

  // null: not currently drawing
  // something else: drawing in progress, image data was saved before drawing
  drawingImageData: null | ImageData = null;

  private color: string = "black";
  private selectedColorManager: RadioClassManager = new RadioClassManager("selected-drawing-color");

  private tool: Tool | null = null;
  private selectedToolManager: RadioClassManager = new RadioClassManager("selected-drawing-tool");

  constructor(canvasId: string) {
    super();

    this.canvas = document.getElementById(canvasId)! as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;

    this.registerEventHandlers();
  }

  private xyFromEvent(event: MouseEvent): [number, number] | null {
    // prevent weird bugs
    if (event.srcElement !== this.canvas) {
      return null;
    }

    // there are two properties that give correct values, one is
    // "experimental" and the other is "non-standard", so i chose the
    // experimental property
    // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/offsetX
    // https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/layerX
    return [event.offsetX, event.offsetY];
  }

  private registerEventHandlers() {
    let mouseMoved = false;

    this.canvas.addEventListener("mousedown", event => {
      const pointOrNull = this.xyFromEvent(event);
      if (pointOrNull === null || this.tool === null || this.readOnly) return;

      event.preventDefault();
      mouseMoved = false;
      this.drawingImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.objects.push(this.tool(pointOrNull!, this.color));
      this.events.push(new DrawEvent());
    });

    this.canvas.addEventListener("mousemove", event => {
      if (this.drawingImageData === null) return;
      mouseMoved = true;

      const pointOrNull = this.xyFromEvent(event);
      if (pointOrNull === null) return;
      this.objects[this.objects.length - 1].onMouseMove(pointOrNull);
      this.ctx.putImageData(this.drawingImageData, 0, 0);
      this.draw(this.objects[this.objects.length - 1]);
      this.emit("change");
    });

    // document because mouse up outside canvas must also stop drawing
    document.addEventListener("mouseup", event => {
      const pointOrNull = this.xyFromEvent(event);
      if (pointOrNull === null || this.drawingImageData === null || this.readOnly) return;

      if (!mouseMoved) {
        // Draw a dot instead of empty stuff.
        this.objects.pop();
        const dot = new Circle(pointOrNull!, this.color, true, 2);
        this.objects.push(dot);
        this.draw(dot);
        this.emit("change");
      }

      this.drawingImageData = null;
    });
  }

  // TODO: the elements are actually input elements, not button elements
  private initToolButton(element: HTMLButtonElement, factory: (point: Point, color: string) => DrawObject) {
    element.addEventListener("click", () => {
      this.selectedToolManager.addClass(element);
      this.tool = factory;
    });
  }

  initToolButtons<S extends ToolButtonSpec>(spec: S) {
    for (const [id, factory] of Object.entries(spec)) {
      const button = document.getElementById(id)! as HTMLButtonElement;
      this.initToolButton(button, factory);
    }
  }

  initClearButton(element: HTMLButtonElement) {
    element.addEventListener("click", () => this.clear());
  }

  private initColorButton(element: HTMLButtonElement) {
    element.addEventListener("click", () => {
      this.selectedColorManager.addClass(element);
      this.color = element.style.backgroundColor;
    });
  }

  initColorButtons(buttonElements: HTMLButtonElement[]) {
    for (const element of buttonElements) {
      this.initColorButton(element);
    }
  }

  draw(obj: DrawObject) {
    this.ctx.fillStyle = obj.color;
    this.ctx.strokeStyle = obj.color;

    switch (obj.lineMode) {
      case LineMode.Fill:
        this.ctx.fill(obj.path);
        break;

      case LineMode.Stroke:
        this.ctx.stroke(obj.path);
        break;
    }
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.objects.forEach(obj => this.draw(obj));
  }

  undo() {
    if (this.drawingImageData !== null) return;
    if (this.events.length === 0) return;
    this.events.pop()?.undo(this);
    this.redraw();
    this.emit("change");
  }

  clear() {
    if (this.drawingImageData !== null || this.objects.length === 0) return;
    this.events.push(new ClearEvent(this.objects.splice(0)));
    this.redraw();
    this.emit("change");
  }

  getImageString() {
    let color = "black";
    return this.objects.flatMap(obj => {
      if (obj.color !== color) {
        color = obj.color;
        return [ `color=${obj.color}`, obj.toStringPart() ];
      }
      return [ obj.toStringPart() ];
    }).join("|");
  }

  setImageString(imageString: string) {
    if (imageString === "") {
      this.objects = [];
      this.events = [];
    } else {
      let color = "black";
      this.objects = imageString.split("|").map(stringPart => {
        if (stringPart.startsWith("color=")) {
          color = stringPart.slice("color=".length);
          return null;
        }

        if (stringPart.startsWith("circle;")) {
          return Circle.fromStringPart(stringPart, color);
        }

        return Pen.fromStringPart(stringPart, color);
      }).filter(obj => obj !== null).map(obj => obj!);
      this.events = this.objects.map(() => new DrawEvent());
    }
    this.redraw();
  }

  getDataUrl() {
    return this.canvas.toDataURL();
  }
}
