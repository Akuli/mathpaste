import { CanvasManager } from "../canvasmanager";
import { Point, DrawObject } from "./drawobject";

export default class Circle extends DrawObject {
  private mouseMoveImageData: ImageData | null = null;

  public radius: number = 0;
  public filled: boolean = false;

  constructor(parent: CanvasManager, public center: Point) { super(parent); }

  draw() {
    this.ctx.beginPath();
    this.ctx.arc(this.center[0], this.center[1], this.radius, 0, 2 * Math.PI);
    if (this.filled) {
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }
    this.parent.emit("change");
  }

  onMouseMove(xy: Point) {
    if (this.mouseMoveImageData === null) {
      this.mouseMoveImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.putImageData(this.mouseMoveImageData, 0, 0);
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
    return "circle;" + this.center.join(";") + ";" + this.radius + ";" + (+!!this.filled);
  }

  static fromStringPart(parent: CanvasManager, stringPart: string): DrawObject {
    const [circleString, centerX, centerY, radius, isFilled] = stringPart.split(";");
    if (circleString !== "circle") {
      throw new Error("does not look like a circle string part: " + stringPart);
    }

    const circle = new Circle(parent, [+centerX, +centerY]);
    circle.radius = +radius;
    circle.filled = !!+isFilled;
    return circle;
  }
}
