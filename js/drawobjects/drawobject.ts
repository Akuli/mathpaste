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

  /**
  When rubbering, a draw object gets replaced with the objects returned by this method.
  This method should `return [this];` if the rubber does not touch the draw object.
  */
  getObjectsToReplaceWithWhenErasing(eraserCenter: Point, eraserRadius: number): DrawObject[];
}
