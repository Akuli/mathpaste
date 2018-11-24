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

    class Line {
      constructor(pointArray) {
        if (pointArray.length === 0) {
          throw new Error("cannot create a line of 0 points");
        }
        this.points = pointArray;   // array of [x,y] integer arrays
      }

      // be sure to run drawCallbacks when needed! this doesn't do that for you
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

      addPointAndDraw(newXY) {
        this.points.push(newXY);

        // draw the new component without redrawing everything else
        context.beginPath();
        context.moveTo(...( this.points[this.points.length - 2] ));
        context.lineTo(...( this.points[this.points.length - 1] ));
        context.stroke();

        for (const cb of drawCallbacks) { cb(); }
      }

      // like 'x1,y1;x2,y2;...' where xs and ys are integers
      toStringPart() {
        return this.points.map(xy => xy.join(',')).join(';');
      }

      static fromStringPart(stringPart) {
        return new Line(stringPart.split(';').map(xy => xy.split(',').map(value => +value)));
      }
    }

    class Circle {
      constructor(center, radius, filled) {
        this.center = center;
        this.radius = radius;
        this.filled = filled;
      }

      // be sure to run drawCallbacks when needed! this doesn't do that for you
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

    let drawnObjects = [];    // contains Circles and Lines
    const drawCallbacks = [];   // run with no arguments when canvas content changes
    let currentlyDrawingALine = false;

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

    canvas.addEventListener('mousedown', event => {
        currentlyDrawingALine = true;
        drawnObjects.push(new Line([ xyFromEvent(event) ]));
        for (const cb of drawCallbacks) { cb(); }
        event.preventDefault();   // prevent e.g. selecting some text, that's annoying
    });

    canvas.addEventListener('mousemove', event => {
        if (currentlyDrawingALine) {
          drawnObjects[drawnObjects.length - 1].addPointAndDraw(xyFromEvent(event));
        }
    });

    // document because mouse up outside canvas must also stop drawing
    document.addEventListener('mouseup', event => {
        if (currentlyDrawingALine && drawnObjects[drawnObjects.length - 1].points.length === 1) {
          // canvas was clicked without dragging the mouse at all, draw small circle here
          const circle = new Circle(xyFromEvent(event), 3, true);
          drawnObjects.pop();
          drawnObjects.push(circle);
          circle.draw();
          for (const cb of drawCallbacks) { cb(); }
        }
        currentlyDrawingALine = false;
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
          if (drawnObjects.length !== 0 && !currentlyDrawingALine) {
            drawnObjects.pop();
            redrawEverything();
          }
        }
    };
});
