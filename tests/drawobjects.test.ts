import { CanvasManager, Eraser } from "../js/canvasmanager";
import { Circle } from "../js/drawobjects/circle";
import { Pen, intervalSetDifference } from "../js/drawobjects/pen";

describe("Circle", () => {
  it("calculates distance correctly", () => {
    const filledCircle = new Circle([3, 0], "red", true, 1);
    const nonFilledCircle = new Circle([3, 0], "red", false, 1);
    expect(filledCircle.distanceToPoint([3.8, 0])).toEqual(0);
    expect(nonFilledCircle.distanceToPoint([3.8, 0])).toBeCloseTo(0.2);
    expect(filledCircle.distanceToPoint([5, 0])).toEqual(1);
    expect(nonFilledCircle.distanceToPoint([5, 0])).toEqual(1);
  });
});

describe("Pen", () => {
  it("does interval set difference", () => {
    expect(intervalSetDifference([1, 4], [2, 3])).toEqual([ [1,2], [3,4] ]);
    expect(intervalSetDifference([1, 4], [-10, 10])).toEqual([]);
    expect(intervalSetDifference([1, 4], [1, 4])).toEqual([]);

    expect(intervalSetDifference([1, 4], [2, 4])).toEqual([ [1,2] ]);
    expect(intervalSetDifference([1, 4], [2, 10])).toEqual([ [1,2] ]);
    expect(intervalSetDifference([1, 4], [-10, 3])).toEqual([ [3,4] ]);
    expect(intervalSetDifference([1, 4], [1, 3])).toEqual([ [3,4] ]);
  });

  it("undoes correctly", () => {
    const canvas = document.createElement("canvas");
    canvas.id = "canvas";
    document.body.append(canvas);
    const cm = new CanvasManager("canvas");
    const eraser = new Eraser(100);

    const longLine = new Pen([0, 0], "black");
    longLine.addPoint([400, 0]);

    cm.objects.push(longLine);
    expect(cm.objects).toHaveLength(1);
    expect(cm.objects).toContain(longLine);

    expect(eraser.onMouseDown(cm, [200, 150])).toHaveLength(0);
    expect(cm.objects).toHaveLength(1);
    expect(cm.objects).toContain(longLine);

    const undoSlices = eraser.onMouseDown(cm, [200, 0]);
    expect(cm.objects).toHaveLength(2);
    expect(cm.objects).not.toContain(longLine);
    expect(cm.objects[0]).toBeInstanceOf(Pen);
    expect(cm.objects[1]).toBeInstanceOf(Pen);
    expect((cm.objects[0] as Pen).points).toEqual([[0, 0], [100, 0]]);
    expect((cm.objects[1] as Pen).points).toEqual([[300, 0], [400, 0]]);

    expect(undoSlices).toEqual([{ startIndex: 0, deleteCount: 2, objectsToInsert: [longLine] }]);
  });
});
