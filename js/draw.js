/*
i experimented with different ways to convert the image data to a string:

1) coordinates of end points of drawn lines joined with separator characters
2) the full image data as one character for each pixel

strings from 2 are of course about 1000 times longer than strings from 1, and
that was still true after compressing with lzstring, with almost nothing drawn
on the canvas and with lots of stuff drawn
*/

define([], function() {
    "use strict";

    const canvas = document.getElementById('draw-canvas');
    const context = canvas.getContext('2d');

    const penButton = document.getElementById('draw-pen-button');
    const circleButton = document.getElementById('draw-circle-button');
    const lineButton = document.getElementById('draw-line-button');
    const allButtons = [ penButton, circleButton, lineButton ];

    for (const button of allButtons) {
      button.addEventListener('click', event => {
        for (const otherButton of allButtons) {
          otherButton.classList.remove('selected');
        }
        event.target.classList.add('selected');
      });
    }

    class Line {
      constructor(pointArray) {
        if (pointArray.length === 0) {
          throw new Error("cannot create a line of 0 points");
        }
        this.points = pointArray;   // array of [x,y] integer arrays
      }

      draw() {
        if (this.points.length >= 2) {
          context.beginPath();
          context.moveTo(...( this.points[0] ));
          for (const xy of this.points.slice(1)) {
            context.lineTo(...xy);
          }
          context.stroke();
        }
      }

      onMouseMove(xy) {
        this.points.push(xy);

        // draw the new component without redrawing everything else
        context.beginPath();
        context.moveTo(...( this.points[this.points.length - 2] ));
        context.lineTo(...( this.points[this.points.length - 1] ));
        context.stroke();

        for (const cb of drawCallbacks) { cb(); }
      }

      onMouseUp() { }

      // like 'x1,y1;x2,y2;...' where xs and ys are integers
      toStringPart() {
        return this.points.map(xy => xy.join(',')).join(';');
      }

      static fromStringPart(stringPart) {
        return new Line(stringPart.split(';').map(xy => xy.split(',').map(value => +value)));
      }
    }

    class TwoPointLine extends Line {
      constructor(_point) {
        super([ _point ]);
        this._mouseMoveImageData = null;
      }

      onMouseMove(xy) {
        // there seems to be no easy way to delete an already drawn circle from
        // the canvas, so image data tricks are the best i can do
        if (this._mouseMoveImageData === null) {
          this._mouseMoveImageData = context.getImageData(0, 0, canvas.width, canvas.height);
        } else {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.putImageData(this._mouseMoveImageData, 0, 0);
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
        this._mouseMoveImageData = null;    // to avoid memory leaking
      }
    }

    class Circle {
      constructor(center, radius, filled) {
        this.center = center;
        this.radius = radius;
        this.filled = filled;
        this._mouseMoveImageData = null;
      }

      draw() {
        context.beginPath();
        const [ centerX, centerY ] = this.center;
        context.arc(centerX, centerY, this.radius, 0, 2*Math.PI);
        if (this.filled) {
          context.fill();
        } else {
          context.stroke();
        }
      }

      onMouseMove(xy) {
        if (this._mouseMoveImageData === null) {
          this._mouseMoveImageData = context.getImageData(0, 0, canvas.width, canvas.height);
        } else {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.putImageData(this._mouseMoveImageData, 0, 0);
        }

        this.radius = Math.round(Math.hypot(this.center[0] - xy[0], this.center[1] - xy[1]));
        this.draw();
      }

      onMouseUp() {
        this._mouseMoveImageData = null;
      }

      // 'circle;x;y;r;1' is a filled circle centered at (x,y) with radius r
      // 'circle;x;y;r;0' is an open circle centered at (x,y) with radius r
      // x, y and r are integers
      toStringPart() {
        return 'circle;' + this.center.join(';') + ';' + this.radius + ';' + (+!!this.filled);
      }

      static fromStringPart(stringPart) {
        const [ circleString, centerX, centerY, radius, isFilled ] = stringPart.split(';');
        if (circleString !== 'circle') {
          throw new Error("does not look like a circle string part: " + stringPart);
        }
        return new Circle([ +centerX, +centerY ], +radius, !!+isFilled);
      }
    }

    let drawnObjects = [];            // contains Circles and Lines that show on canvas
    const drawCallbacks = [];         // run with no arguments when canvas content changes
    let currentlyDrawnObject = null;  // this is what the user is currently drawing

    const xyFromEvent = event => {
        // there are two properties that give correct values, one is
        // "experimental" and the other is "non-standard", so i chose the
        // experimental property
        // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/offsetX
        // https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/layerX
        return [ event.offsetX, event.offsetY ];
    };

    function redrawEverything() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (const object of drawnObjects) {
        object.draw();
      }
      for (const cb of drawCallbacks) { cb(); }
    }

    let mouseWasDragged;

    canvas.addEventListener('mousedown', event => {
      mouseWasDragged = false;

      if (penButton.classList.contains('selected')) {
        currentlyDrawnObject = new Line([ xyFromEvent(event) ]);
      } else if (circleButton.classList.contains('selected')) {
        currentlyDrawnObject = new Circle(xyFromEvent(event), 0, false);
      } else if (lineButton.classList.contains('selected')) {
        currentlyDrawnObject = new TwoPointLine(xyFromEvent(event));
      } else {
        throw new Error("buttons are in an inconsistent state");
      }

      for (const cb of drawCallbacks) { cb(); }
      event.preventDefault();   // prevent e.g. selecting some text, that's annoying
    });

    canvas.addEventListener('mousemove', event => {
      if (currentlyDrawnObject !== null) {
        mouseWasDragged = true;
        currentlyDrawnObject.onMouseMove(xyFromEvent(event));
      }
    });

    // document because mouse up outside canvas must also stop drawing
    document.addEventListener('mouseup', event => {
      if (currentlyDrawnObject !== null) {
        currentlyDrawnObject.onMouseUp();

        if (mouseWasDragged) {
          drawnObjects.push(currentlyDrawnObject);
        } else {
          const circle = new Circle(xyFromEvent(event), 3, true);
          circle.draw();
          drawnObjects.push(circle);
        }
        currentlyDrawnObject = null;

        for (const cb of drawCallbacks) { cb(); }
      }
    });

    return {
        getImageString() {
          const stringParts = [];
          for (const object of drawnObjects) {
            stringParts.push(object.toStringPart());
          }
          return stringParts.join('|');
        },
        setImageString(imageString) {
          drawnObjects = [];

          if (imageString.length !== 0) {    // ''.split('|') is [''], which screws up everything
            for (const stringPart of imageString.split('|')) {
              if (stringPart.startsWith('circle;')) {
                drawnObjects.push(Circle.fromStringPart(stringPart));
              } else {
                drawnObjects.push(Line.fromStringPart(stringPart));
              }
            }
          }
          redrawEverything();
        },
        getDataUrl() {
            return canvas.toDataURL();
        },
        addDrawingCallback(cb) {
            drawCallbacks.push(cb);
        },
        undo() {
          if (drawnObjects.length !== 0 && currentlyDrawnObject === null) {
            drawnObjects.pop();
            redrawEverything();
          }
        }
    };
});
