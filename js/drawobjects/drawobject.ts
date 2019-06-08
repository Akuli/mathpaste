export type Point = [number, number];

export type LineMode = "stroke" | "fill";

export interface DrawObject {
  lineMode: LineMode;
  path: Path2D;

  onMouseMove(point: Point): void;
  onMouseUp(): void;

  toStringPart(): string;
}
