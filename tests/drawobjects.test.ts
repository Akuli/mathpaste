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
