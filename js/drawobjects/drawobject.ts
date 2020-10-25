export type Point = [number, number];

export function distance([x1, y1]: Point, [x2, y2]: Point) {
  return Math.hypot(x2 - x1, y2 - y1);
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
  toStringPart(): string;

  // return value is list of objects to replace this with
  getErasingObjects(eraserCenter: Point, eraserRadius: number): DrawObject[];
}
