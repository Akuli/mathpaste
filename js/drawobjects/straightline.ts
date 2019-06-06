import { Point } from "./drawobject";
import Pen from "./pen";

export default class StraightLine extends Pen {
  private mouseMoveImageData: ImageData | null = null;

  onMouseMove(xy: Point) {
    // there seems to be no easy way to delete an already drawn circle from
    // the canvas, so image data tricks are the best i can do
    if (this.mouseMoveImageData === null) {
      this.mouseMoveImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.putImageData(this.mouseMoveImageData, 0, 0);
    }

    if (this.points.length === 1) {
      this.points.push(xy);
    } else if (this.points.length === 2) {
      this.points[1] = xy;
    } else {
      throw new Error("the TwoPointLine is in an inconsistent state");
    }

    this.draw();
  }

  onMouseUp() {
    super.onMouseUp();
    this.mouseMoveImageData = null; // to avoid memory leaking
  }
}
