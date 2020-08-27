import { RadioClassManager, StrictEventEmitter } from "./utils";
import { Pen } from "./drawobjects/pen";
import { Circle } from "./drawobjects/circle";

import { Point, LineMode, DrawObject } from "./drawobjects/drawobject";

interface CanvasManagerEvents {
  change: () => void;
}

type ToolButtonSpec = Record<string, (point: Point, color: string) => DrawObject>;

export class CanvasManager extends StrictEventEmitter<CanvasManagerEvents>() {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  // TODO: is this really needed after c9d6687 ?
  readOnly: boolean = false;

  objects: DrawObject[] = [];
  drawing: boolean = false;

  private color: string = "black";
  private selectedColorManager: RadioClassManager = new RadioClassManager("selected-drawing-color");

  private tool: ((point: Point, color: string) => DrawObject) | null = null;
  private selectedToolManager: RadioClassManager = new RadioClassManager("selected-drawing-tool");

  private imageData: ImageData | null = null;

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
      event.preventDefault();
      if (this.readOnly) return;
      mouseMoved = false;
      if (this.tool === null) return;

      const pointOrNull = this.xyFromEvent(event);
      if (pointOrNull === null) return;
      this.drawing = true;
      this.objects.push(this.tool(pointOrNull!, this.color));
    });

    this.canvas.addEventListener("mousemove", event => {
      if (!this.drawing) return;
      mouseMoved = true;

      const pointOrNull = this.xyFromEvent(event);
      if (pointOrNull === null) return;
      this.objects[this.objects.length - 1].onMouseMove(pointOrNull!);
      this.draw(this.objects[this.objects.length - 1]);
    });

    // document because mouse up outside canvas must also stop drawing
    document.addEventListener("mouseup", event => {
      if (this.readOnly) return;

      if (!mouseMoved) {
        // Draw a dot instead of empty stuff.
        const pointOrNull = this.xyFromEvent(event);
        if (pointOrNull === null) return;

        if (this.drawing) this.objects.pop();
        const dot = new Circle(pointOrNull!, this.color, true, 2);
        this.objects.push(dot);
        this.draw(dot);
      }

      this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.drawing = false;
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
    if (this.imageData !== null) this.ctx.putImageData(this.imageData, 0, 0);

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
    if (imageString === "") return;

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

    this.redraw();
  }

  getDataUrl() {
    return this.canvas.toDataURL();
  }
}
