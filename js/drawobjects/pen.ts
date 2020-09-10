/*
i experimented with different ways to convert the image data to a string:

1) coordinates of end points of drawn lines joined with separator characters
2) the full image data as one character for each pixel

strings from 2 are of course about 1000 times longer than strings from 1, and
that was still true after compressing with lzstring, with almost nothing drawn
on the canvas and with lots of stuff drawn
*/

import { Point, distance, LineMode, DrawObject } from "./drawobject";

const POINT_DISTANCE_THRESHOLD: number = 2;

const dotProduct = (a: Point, b: Point) => a[0]*b[0] + a[1]*b[1];
const addVectors = (a: Point, b: Point) => [a[0] + b[0], a[1] + b[1]] as [number, number];
const subVectors = (a: Point, b: Point) => [a[0] - b[0], a[1] - b[1]] as [number, number];

/*
If a point directly lines up with line AB, like this


      point

  A----------------B

then returns distance between line and point. Otherwise returns null.
*/
function distanceBetweenLineSegmentAndPoint(A: Point, B: Point, point: Point): number | null {
  const aToB = subVectors(B, A);
  const aToPoint = subVectors(point, A);
  const dot = dotProduct(aToB, aToPoint);
  const abDistanceSquared = dotProduct(aToB, aToB);
  if (dot <= 0 || dot >= abDistanceSquared) {
    return null;
  }

  // project aToPoint onto aToB
  const projectionVector = [
    dot / abDistanceSquared * aToB[0],
    dot / abDistanceSquared * aToB[1],
  ] as [number, number];
  const projectedPoint = addVectors(A, projectionVector);
  return distance(projectedPoint, point);
}

export class Pen implements DrawObject {
  lineMode: LineMode = LineMode.Stroke;
  path: Path2D;
  points: Point[];

  constructor(startPoint: Point, public color: string) {
    this.path = new Path2D();
    this.path.moveTo(...startPoint);
    this.points = [startPoint];
  }

  private shouldAdd(point: Point): boolean {
    if (this.points.length > 0) {
      return distance(point, this.points[this.points.length - 1]) >= POINT_DISTANCE_THRESHOLD;
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

  distanceToPoint(point: Point) {
    let smallestDist = Math.min(...this.points.map(p => distance(p, point)));
    for (let i = 1; i < this.points.length; i++) {
      const currentDist = distanceBetweenLineSegmentAndPoint(this.points[i-1], this.points[i], point);
      if (currentDist !== null) {
        smallestDist = Math.min(smallestDist, currentDist);
      }
    }
    return smallestDist;
  }

  // like 'x1,y1;x2,y2;...' where xs and ys are integers
  toStringPart() {
    return this.points.map(xy => xy.join(",")).join(";");
  }

  static fromStringPart(stringPart: string, color: string): DrawObject {
    const points = stringPart.split(";").map(xy => xy.split(",").map(value => +value) as Point);

    const pen = new Pen(points.shift()!, color);
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
