import { Point, LineMode, DrawObject } from "./drawobject";

const POINT_DISTANCE_THRESHOLD: number = 2;

export class Pen implements DrawObject {
  lineMode: LineMode = LineMode.Stroke;

  path: Path2D;

  points: Point[];

  constructor(startPoint: Point) {
    this.path = new Path2D();
    this.path.moveTo(...startPoint);
    this.points = [startPoint];
  }

  private shouldAdd([x, y]: Point): boolean {
    if (this.points.length > 0) {
      const [lx, ly] = this.points[this.points.length - 1];

      return Math.hypot(x - lx, y - ly) >= POINT_DISTANCE_THRESHOLD;
    } else {
      return true;
    }
  }

  addPoint(point: Point) {
    if (this.shouldAdd(point)) {
      this.path.lineTo(...point);
      this.points.push(point);
    }
  }

  onMouseMove(point: Point) {
    this.addPoint(point);
  }

  // like 'x1,y1;x2,y2;...' where xs and ys are integers
  toStringPart() {
    return this.points.map(xy => xy.join(",")).join(";");
  }

  static fromStringPart(stringPart: string): DrawObject {
    const points = stringPart.split(";").map(xy => xy.split(",").map(value => +value)) as Point[];

    const pen = new Pen(points.shift()!);
    points.forEach(point => pen.addPoint(point));
    return pen;
  }
}

export class StraightLine extends Pen {
  onMouseMove(point: Point) {
    this.points[1] = point;

    this.path = new Path2D();
    this.path.moveTo(...this.points[0]);
    this.path.lineTo(...this.points[1]);
  }
}
