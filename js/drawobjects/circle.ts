import { Point, distance, LineMode, DrawObject } from "./drawobject";

export class Circle implements DrawObject {
  lineMode: LineMode;
  path: Path2D;

  constructor(public center: Point, public color: string, filled: boolean = false, public radius: number = 0) {
    this.lineMode = filled ? LineMode.Fill : LineMode.Stroke;

    this.path = new Path2D();
    this.path.arc(this.center[0], this.center[1], this.radius, 0, 2 * Math.PI);
  }

  onMouseMove(xy: Point) {
    this.radius = Math.round(distance(this.center, xy));
    this.path = new Path2D();
    this.path.arc(this.center[0], this.center[1], this.radius, 0, 2 * Math.PI);
  }

  distanceToPoint(point: Point) {
    if (this.lineMode === LineMode.Fill) {
      return Math.max(distance(this.center, point) - this.radius, 0);
    }
    return Math.abs(distance(this.center, point) - this.radius);
  }

  // 'circle;x;y;r;1' is a filled circle centered at (x,y) with radius r
  // 'circle;x;y;r;0' is an open circle centered at (x,y) with radius r
  // x, y and r are integers
  toStringPart() {
    return "circle;" + this.center.join(";") + ";" + this.radius + ";" + +!!(this.lineMode === LineMode.Fill);
  }

  static fromStringPart(stringPart: string, color: string): DrawObject {
    const [circleString, centerX, centerY, radius, isFilled] = stringPart.split(";");
    if (circleString !== "circle") {
      throw new Error("does not look like a circle string part: " + stringPart);
    }

    return new Circle([+centerX, +centerY], color, !!+isFilled, +radius);
  }
}
