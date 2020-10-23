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
The set interval1 \ interval2 is a union of 0, 1 or 2 intervals.
This returns the end points of those intervals.
Exported because tests.
*/
export function intervalSetDifference(interval1: [number, number], interval2: [number, number]): [number, number][] {
  let [a1, b1] = interval1;
  let [a2, b2] = interval2;
  return [
    [a1, Math.min(a2, b1)] as [number, number],
    [Math.max(a1, b2), b1] as [number, number],
  ].filter(([start, end]) => start < end);
}

// Return the parts of line segment between A and B that are outside a circle
function splitLineSegmentWithCircle(A: Point, B: Point, center: Point, radius: number): [Point, Point][] {
  // We represent the line as f(t) = A + (B-A)t, where 0 <= t <= 1
  function f(t: number): Point {
    return addVectors(A, subVectors(B, A).map(coordinate => coordinate*t) as [number, number]);
  }

  /*
  Line and circle intersect when distance(f(t) - center) = radius
  With dot products, we can rewrite that as dotProduct(f(t) - center, f(t) - center) = radius^2
  After expanding, we can solve t with the quadratic formula
  */
  const AC = subVectors(A, center);
  const BA = subVectors(B, A);
  const ACBA = dotProduct(AC, BA);
  const ACAC = dotProduct(AC, AC);
  const BABA = dotProduct(BA, BA);

  const squareRoot = Math.sqrt(ACBA*ACBA - ACAC*BABA + BABA*radius*radius);
  if (isNaN(squareRoot)) {
    // No intersection points of circle and line
    return [[A, B]];
  }
  const tMin = (-ACBA - squareRoot)/BABA;
  const tMax = (-ACBA + squareRoot)/BABA;
  const result = intervalSetDifference([0, 1], [tMin, tMax]).map(tInterval => tInterval.map(t => f(t)) as [Point, Point]);
  return result;
}

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
    this.path.lineTo(...point);
    this.points.push(point);
  }

  onMouseMove(point: Point) {
    if (this.shouldAdd(point)) {
      this.addPoint(point);
    }
  }

  private smallestDistanceToPoint(point: Point) {
    let smallestDist = Math.min(...this.points.map(p => distance(p, point)));
    for (let i = 1; i < this.points.length; i++) {
      const segmentDist = distanceBetweenLineSegmentAndPoint(this.points[i-1], this.points[i], point);
      if (segmentDist !== null) {
        smallestDist = Math.min(smallestDist, segmentDist);
      }
    }
    return smallestDist;
  }

  getErasingObjects(eraserCenter: Point, eraserRadius: number): DrawObject[] {
    if (this.smallestDistanceToPoint(eraserCenter) > eraserRadius) {
      return [this];
    }

    const lineSegments: [Point, Point][] = [];
    for (let i = 1; i < this.points.length; i++) {
      lineSegments.push(...splitLineSegmentWithCircle(this.points[i-1], this.points[i], eraserCenter, eraserRadius));
    }
    if (lineSegments.length === 0) {
      return [];
    }

    const resultLines = [new Pen(lineSegments[0][0], this.color)];
    for (const [start, end] of lineSegments) {
      let lastLine = resultLines[resultLines.length - 1];
      if (start + '' !== lastLine.points[lastLine.points.length - 1] + '') {
        lastLine = new Pen(start, this.color);
        resultLines.push(lastLine);
      }
      lastLine.addPoint(end);
    }
    return resultLines;
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
