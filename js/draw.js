/*
i experimented with different ways to convert the image data to a string:

1) coordinates of end points of drawn lines joined with separator characters
2) the full image data as one character for each pixel

strings from 2 are of course about 1000 times longer than strings from 1, and
that was still true after compressing with lzstring, with almost nothing drawn
on the canvas and with lots of stuff drawn
*/

define([], function() {

    // contains arrays of lines
    // each line is an array of 1 or more points that are connected to form the line
    // each point is an [x,y] array
    let drawnLines = [];

    // these callbacks run when the user starts drawing a line
    const drawCallbacks = [];

    const canvas = document.getElementById('draw-canvas');
    const context = canvas.getContext('2d');
    let currentlyDrawingALine = false;

    const xyFromEvent = event => {
        // there are two properties that give correct values, one is
        // "experimental" and the other is "non-standard", so i chose the
        // experimental property
        // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/offsetX
        // https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/layerX
        return [ event.offsetX, event.offsetY ];
    };

    canvas.addEventListener('mousedown', event => {
        currentlyDrawingALine = true;
        drawnLines.push([ xyFromEvent(event) ]);
        for (let cb of drawCallbacks) { cb(); }
    });

    canvas.addEventListener('mousemove', event => {
        if (currentlyDrawingALine) {
            const line = drawnLines[drawnLines.length - 1];
            const xyNew = xyFromEvent(event);
            context.beginPath();
            context.moveTo(...(line[line.length - 1]));
            context.lineTo(...xyNew);
            context.stroke();
            line.push(xyNew);
        }
    });

    // document because mouse up outside canvas must also stop drawing
    document.addEventListener('mouseup', () => {
        currentlyDrawingALine = false;
    });

    const redrawEverything = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.beginPath();
        for (let line of drawnLines) {
            context.moveTo(...( line[0] ));
            for (let xy of line.slice(1)) {
                context.lineTo(...xy);
            }
        }
        context.stroke();
        for (let cb of drawCallbacks) { cb(); }
    };

    return {
        getImageString() {
            // each line is like x1,y1;x2,y2;... and the lines are separated by |
            return drawnLines.map(line => line.map(xy => xy.join(',')).join(';')).join('|');
        },
        setImageString(imageString) {
            if (imageString.length == 0) {
                // special case: ''.split('|') is [''], which screws up everything
                drawnLines = [];
            } else {
                drawnLines = imageString.split('|').map(line => line.split(';').map(xy => xy.split(',').map(value => +value)));
            }
            redrawEverything();
        },
        addDrawingCallback(cb) {
            drawCallbacks.push(cb);
        },
        undo() {
            if (drawnLines.length !== 0 && !currentlyDrawingALine) {
                drawnLines.pop();
                redrawEverything();
            }
        }
    };
});
