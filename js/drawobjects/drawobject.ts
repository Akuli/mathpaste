export type Point = [number, number];

export function distance(p1: Point, p2: Point) {
  return Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
}

export enum LineMode {
  Stroke,
  Fill,
}

export interface DrawObject {
  lineMode: LineMode;
  path: Path2D;
  color: string;

  onMouseMove(point: Point): void;
  distanceToPoint(point: Point): number;
  toStringPart(): string;
}
