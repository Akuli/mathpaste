/*
i experimented with different ways to convert the image data to a string:

1) coordinates of end points of drawn lines joined with separator characters
2) the full image data as one character for each pixel

strings from 2 are of course about 1000 times longer than strings from 1, and
that was still true after compressing with lzstring, with almost nothing drawn
on the canvas and with lots of stuff drawn
*/

// https://github.com/requirejs/example-multipage/blob/master/www/js/app/controller/c1.js
define(["./lz-string.min.js"], function(LZString) {

    const isCanvasShowing = () => {
        // relying on classes and stuff here feels wrong
        return document.getElementById("draw-box").classList.contains("shown");
    };

    // contains arrays of lines
    // each line is an array of 1 or more points that are connected to form the line
    // each point is an [x,y] array
    let drawnLines = [];

    const canvas = document.getElementById('draw-canvas');
    const context = canvas.getContext('2d');
    let currentlyDrawingALine = false;

    const xyFromEvent = mouseEvent => {
        // there are two properties that give correct values, one is
        // "experimental" and the other is "non-standard", so i chose the
        // experimental property
        // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/offsetX
        // https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/layerX
        return [ event.offsetX, event.offsetY ];
    };

    canvas.addEventListener('mousedown', event => {
        currentlyDrawingALine = true;
        context.beginPath();
        drawnLines.push([ xyFromEvent(event) ]);
    });

    canvas.addEventListener('mousemove', event => {
        if (currentlyDrawingALine) {
            context.beginPath();
            const line = drawnLines[drawnLines.length - 1];
            const xyNew = xyFromEvent(event);
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
    };

    // https://stackoverflow.com/a/16006607
    // adding the event listener to the canvas doesn't work
    document.addEventListener('keydown', event => {
        if (event.key == 'z' && event.ctrlKey && !currentlyDrawingALine && isCanvasShowing() && drawnLines.length !== 0) {
            drawnLines.pop();
            redrawEverything();
        }
    });

    return {
        getImageString() {
            // each line is like x1,y1;x2,y2;... and the lines are separated by |
            const lineString = drawnLines.map(line => line.map(xy => xy.join(',')).join(';')).join('|');
            return LZString.compress(lineString);
        },
        setImageString(compressed) {
            const lineString = LZString.decompress(compressed);
            if (lineString.length == 0) {
                // special case: ''.split('|') is [''], which screws up everything
                drawnLines = [];
            } else {
                drawnLines = lineString.split('|').map(line => line.split(';').map(xy => xy.split(',').map(value => +value)));
            }
            redrawEverything();
        }
    };
});
