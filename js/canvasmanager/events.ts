import { DrawObject } from "./drawobjects/drawobject";
import { CanvasManager } from "./canvasmanager";
export interface Event {
  undo: (cm: CanvasManager) => void;
}
export class DrawEvent implements Event {
  undo(cm: CanvasManager): void {
    console.assert(cm.objects.length !== 0, "undoing draw with empty objects");
    cm.objects.pop();
  }
}
export class ClearEvent implements Event {
  constructor(private objects: DrawObject[]) { }

  undo(cm: CanvasManager): void {
    console.assert(cm.objects.length === 0, "undoing clear without empty objects");
    cm.objects = this.objects;
  }
}
