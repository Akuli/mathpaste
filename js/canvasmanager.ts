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

// Represents arguments of array splice method.
type Splice = {
  startIndex: number;    // negative for relative to end of array
  deleteCount: number;
  objectsToInsert: DrawObject[];
};

interface Tool {
  // These return the Splices that represent undoing whatever was done.
  onMouseDown(cm: CanvasManager, point: Point): Splice[];
  onMouseMove(cm: CanvasManager, point: Point): Splice[];
}

export class DrawingTool implements Tool {
  constructor(private createDrawObject: (point: Point, color: string) => DrawObject) { }

  onMouseDown(cm: CanvasManager, point: Point): Splice[] {
    cm.objects.push(this.createDrawObject(point, cm.color));
    cm.emit("change");
    return [{ startIndex: -1, deleteCount: 1, objectsToInsert: [] }];
  }

  onMouseMove(cm: CanvasManager, point: Point): Splice[] {
    cm.objects[cm.objects.length - 1].onMouseMove(point);
    cm.ctx.putImageData(cm.drawingImageData!, 0, 0);
    cm.draw(cm.objects[cm.objects.length - 1]);
    cm.emit("change");
    return [];
  }
}

export class Eraser implements Tool {
  constructor(private radius: number) {}

  onMouseDown(cm: CanvasManager, point: Point): Splice[] {
    const changes = (
      cm.objects
        .map((object, index) => ({
          object, index,
          replaceWith: object.getErasingObjects(point, this.radius),
        }))
        .filter(({object, replaceWith}) => !(replaceWith.length === 1 && replaceWith[0] === object))
    );
    if (changes.length === 0) {
      return [];
    }

    changes.reverse();
    changes.forEach(change => cm.objects.splice(change.index, 1, ...change.replaceWith));
    cm.redraw();
    cm.emit("change");

    return changes.map(change => ({
      startIndex: change.index,
      deleteCount: change.replaceWith.length,
      objectsToInsert: [change.object],
    }));
  }

  onMouseMove(cm: CanvasManager, point: Point): Splice[] {
    return this.onMouseDown(cm, point);
  }

  updateIndicator(indicator: HTMLDivElement, [x, y]: Point) {
    indicator.style.setProperty("--mouse-x", x + "px");
    indicator.style.setProperty("--mouse-y", y + "px");
    indicator.style.setProperty("--radius", this.radius + "px");
  }
}

type ToolButtonSpec = Record<string, Tool>;

export class CanvasManager extends StrictEventEmitter<CanvasManagerEvents>() {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  readOnly: boolean = false;

  objects: DrawObject[] = [];

  /*
  Splice lists represent what should be done when Ctrl+Z is pressed.
  The last splice list represents the drawing that happened last and the undoing that happens first.
  Each splice list should be in the order that changes happened (will be reversed when undoing).
  */
  private undoSpliceLists: Splice[][] = [];

  // null: not currently drawing
  // something else: drawing in progress, image data was saved before drawing
  drawingImageData: null | ImageData = null;

  color: string = "black";
  private selectedColorManager: RadioClassManager = new RadioClassManager("selected-drawing-color");

  private tool: Tool | null = null;
  private selectedToolManager: RadioClassManager = new RadioClassManager("selected-drawing-tool");

  private eraserIndicator: HTMLDivElement;

  constructor(canvasId: string) {
    super();

    this.canvas = document.getElementById(canvasId)! as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;

    this.eraserIndicator = document.getElementById("draw-eraser-indicator") as HTMLDivElement;
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
      this.undoSpliceLists.push(this.tool.onMouseDown(this, point));
    });

    this.canvas.addEventListener("mousemove", event => {
      const point = this.xyFromEvent(event);
      if (point === null) return;

      if (this.tool instanceof Eraser) {
        this.tool.updateIndicator(this.eraserIndicator, point);
      }

      if (this.drawingImageData === null) return;
      mouseMoved = true;
      this.undoSpliceLists[this.undoSpliceLists.length - 1].push(...this.tool!.onMouseMove(this, point));
    });

    // document because mouse up outside canvas must also stop drawing
    document.addEventListener("mouseup", event => {
      const point = this.xyFromEvent(event);
      if (point === null || this.drawingImageData === null || this.readOnly) return;

      /*
      Don't leave empty splice lists to this.undoSpliceLists.
      Note that they may start off as empty and then become non-empty because of onMouseMove method.
      */
      if (this.undoSpliceLists.length !== 0 && this.undoSpliceLists[this.undoSpliceLists.length - 1].length === 0) {
        this.undoSpliceLists.pop();
      }

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
      if (this.tool instanceof Eraser) {
        this.eraserIndicator.classList.remove("hidden");
      } else {
        this.eraserIndicator.classList.add("hidden");
      }
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
    if (this.undoSpliceLists.length === 0) return;
    for (const undoSplice of [ ...this.undoSpliceLists.pop()! ].reverse()) {
      this.objects.splice(undoSplice.startIndex, undoSplice.deleteCount, ...undoSplice.objectsToInsert);
    }
    this.redraw();
    this.emit("change");
  }

  clear() {
    if (this.drawingImageData !== null || this.objects.length === 0) return;
    this.undoSpliceLists.push([{ startIndex: 0, deleteCount: 0, objectsToInsert: this.objects.splice(0) }]);
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
      this.undoSpliceLists = [];
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
      this.undoSpliceLists = this.objects.map(() => [{ startIndex: -1, deleteCount: 1, objectsToInsert: [] }]);
    }
    this.redraw();
  }

  getDataUrl() {
    return this.canvas.toDataURL();
  }
}
