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

type Splice<T> = {
  startIndex: number;    // negative for relative to end of array
  deleteCount: number;
  objectsToInsert: T[];
};

interface Tool {
  // returned splices represent what undoing does
  onMouseDown(cm: CanvasManager, point: Point): Splice<DrawObject>[];
  onMouseMove(cm: CanvasManager, point: Point): Splice<DrawObject>[];
}

export class DrawingTool implements Tool {
  constructor(private createDrawObject: (point: Point, color: string) => DrawObject) { }

  onMouseDown(cm: CanvasManager, point: Point): Splice<DrawObject>[] {
    cm.objects.push(this.createDrawObject(point, cm.color));
    cm.emit("change");
    return [{ startIndex: -1, deleteCount: 1, objectsToInsert: [] }];
  }

  onMouseMove(cm: CanvasManager, point: Point): Splice<DrawObject>[] {
    cm.objects[cm.objects.length - 1].onMouseMove(point);
    cm.ctx.putImageData(cm.drawingImageData!, 0, 0);
    cm.draw(cm.objects[cm.objects.length - 1]);
    cm.emit("change");
    return [];
  }
}

export class Rubber implements Tool {
  onMouseDown(cm: CanvasManager, point: Point): Splice<DrawObject>[] {
    const rubberSize = 5;

    const objectsToDelete = (
      cm.objects
        .map((object, index) => ({object, index}))
        .filter(({object}) => object.distanceToPoint(point) < rubberSize)
    );

    const indexesToDelete = new Set(objectsToDelete.map(({index}) => index));
    cm.objects = cm.objects.filter((object, index) => !indexesToDelete.has(index));
    if (indexesToDelete.size !== 0) {
      cm.redraw();
      cm.emit("change");
    }

    const rubberEvents = objectsToDelete.map(({object, index}) => ({
      startIndex: index,
      deleteCount: 0,
      objectsToInsert: [object],
    }));
    rubberEvents.reverse();   // avoid messing up indexes
    return rubberEvents;
  }

  onMouseMove(cm: CanvasManager, point: Point): Splice<DrawObject>[] {
    return this.onMouseDown(cm, point);
  }
}

type ToolButtonSpec = Record<string, Tool>;

export class CanvasManager extends StrictEventEmitter<CanvasManagerEvents>() {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  readOnly: boolean = false;

  objects: DrawObject[] = [];

  private undoSplices: Splice<DrawObject>[] = [];

  // null: not currently drawing
  // something else: drawing in progress, image data was saved before drawing
  drawingImageData: null | ImageData = null;

  color: string = "black";
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
      const point = this.xyFromEvent(event);
      if (point === null || this.tool === null || this.readOnly) return;

      event.preventDefault();
      mouseMoved = false;
      this.drawingImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.undoSplices.push(...this.tool.onMouseDown(this, point));
    });

    this.canvas.addEventListener("mousemove", event => {
      if (this.drawingImageData === null) return;
      mouseMoved = true;

      const point = this.xyFromEvent(event);
      if (point === null) return;
      this.undoSplices.push(...this.tool!.onMouseMove(this, point));
    });

    // document because mouse up outside canvas must also stop drawing
    document.addEventListener("mouseup", event => {
      const point = this.xyFromEvent(event);
      if (point === null || this.drawingImageData === null || this.readOnly) return;

      if (!mouseMoved && (this.tool instanceof DrawingTool)) {
        // Draw a dot instead of empty stuff.
        this.objects.pop();
        const dot = new Circle(point!, this.color, true, 2);
        this.objects.push(dot);
        this.draw(dot);
        this.emit("change");
      }

      this.drawingImageData = null;
    });
  }

  // TODO: the elements are actually input elements, not button elements
  private initToolButton(element: HTMLButtonElement, tool: Tool) {
    element.addEventListener("click", () => {
      this.selectedToolManager.addClass(element);
      this.tool = tool;
    });
  }

  initToolButtons<S extends ToolButtonSpec>(spec: S) {
    for (const [id, tool] of Object.entries(spec)) {
      const button = document.getElementById(id)! as HTMLButtonElement;
      this.initToolButton(button, tool);
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
    if (this.undoSplices.length === 0) return;
    const undoSplice = this.undoSplices.pop()!;
    this.objects.splice(undoSplice.startIndex, undoSplice.deleteCount, ...undoSplice.objectsToInsert);
    this.redraw();
    this.emit("change");
  }

  clear() {
    if (this.drawingImageData !== null || this.objects.length === 0) return;
    this.undoSplices.push({ startIndex: 0, deleteCount: 0, objectsToInsert: this.objects.splice(0) });
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
      this.undoSplices = [];
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
      this.undoSplices = this.objects.map(() => ({ startIndex: -1, deleteCount: 1, objectsToInsert: [] }));
    }
    this.redraw();
  }

  getDataUrl() {
    return this.canvas.toDataURL();
  }
}
