export type Point = [number, number];

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
}
