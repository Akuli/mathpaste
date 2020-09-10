import { CanvasManager } from "../js/canvasmanager";
import { Circle } from "../js/drawobjects/circle";
import { Pen } from "../js/drawobjects/pen";

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
  it("calculates distance correctly", () => {
    const p = new Pen([100, 0], "blue");
    p.addPoint([300, 0]);
    p.addPoint([200, 100]);

    expect(p.distanceToPoint([0, 0])).toEqual(100);
    expect(p.distanceToPoint([200, 150])).toEqual(50);
    expect(p.distanceToPoint([400, -100])).toBeCloseTo(100*Math.sqrt(2));
    expect(p.distanceToPoint([234, -7])).toEqual(7);
    expect(p.distanceToPoint([234, 7])).toEqual(7);
  });
});
