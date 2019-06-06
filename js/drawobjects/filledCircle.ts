import { CanvasManager } from "../canvasmanager";
import { Point } from "./drawobject";
import Circle from "./circle";

export default class FilledCircle extends Circle {
  constructor(parent: CanvasManager, center: Point) { super(parent, center); this.filled = true; }
}
