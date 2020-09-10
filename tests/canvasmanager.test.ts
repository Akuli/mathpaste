import { CanvasManager } from "../js/canvasmanager";
import { Circle } from "../js/drawobjects/circle";

describe("CanvasManager", () => {
  it("can undo clearing the canvas", () => {
    const canvas = document.createElement("canvas");
    canvas.id = "canvas";
    document.body.append(canvas);
    const cm = new CanvasManager("canvas");

    const circle = new Circle([0, 0], "red");

    expect(cm.objects).toHaveLength(0);
    cm.objects.push(circle);
    expect(cm.objects).toEqual([circle]);
    cm.clear();
    expect(cm.objects).toHaveLength(0);
    cm.undo();
    expect(cm.objects).toEqual([circle]);
  });
});
