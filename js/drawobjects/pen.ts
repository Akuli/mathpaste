import { CanvasManager } from "../canvasmanager";
import { Point, DrawObject } from "./drawobject";

const POINT_DISTANCE_THRESHOLD: number = 2;

export default class Pen extends DrawObject {
  points: Point[];

  constructor(public parent: CanvasManager, points: Point[] | Point) {
    super(parent);

    if (Array.isArray(points[0])) {
      this.points = points as Point[];
    } else {
      this.points = [points as Point];
    }
  }

  draw() {
    if (this.points.length >= 2) {
      this.ctx.beginPath();
      this.ctx.moveTo(...(this.points[0]));
      for (const xy of this.points.slice(1)) {
        this.ctx.lineTo(...xy);
      }
      this.ctx.stroke();
    }
  }

  addPoint([x, y]: Point): boolean {
    if (this.points.length > 0) {
      const [lx, ly] = this.points[this.points.length - 1];
      if (Math.hypot(x - lx, y - ly) < POINT_DISTANCE_THRESHOLD) return false;
    }

    this.points.push([x, y]);
    return true;
  }

  onMouseMove(point: Point) {
    if (!this.addPoint(point)) return;

    // draw the new component without redrawing everything else
    this.ctx.beginPath();
    this.ctx.moveTo(...(this.points[this.points.length - 2]));
    this.ctx.lineTo(...(this.points[this.points.length - 1]));
    this.ctx.stroke();

    this.parent.emit("change");
  }

  onMouseUp() { /**/ }

  // like 'x1,y1;x2,y2;...' where xs and ys are integers
  toStringPart() {
    return this.points.map(xy => xy.join(",")).join(";");
  }

  static fromStringPart(parent: CanvasManager, stringPart: string): DrawObject {
    return new Pen(parent, stringPart.split(";").map(xy => xy.split(",").map(value => +value)) as Point[]);
  }
}
