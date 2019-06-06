import { CanvasManager } from "../canvasmanager";

export type Point = [number, number];

export abstract class DrawObject {
  constructor(public parent: CanvasManager) {}

  get canvas(): HTMLCanvasElement { return this.parent.canvas; }
  get ctx(): CanvasRenderingContext2D { return this.parent.ctx; }

  abstract draw(): void;

  abstract onMouseMove(xy: Point): void;

  abstract onMouseUp(): void;

  abstract toStringPart(): string;
}

export interface DrawObjectFactory {
  new(parent: CanvasManager, point: Point): DrawObject;

  fromStringPart(parent: CanvasManager, stringPart: string): DrawObject;
}
