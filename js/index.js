/* jshint browser: true, esnext: true */

(function() {
    "use strict";

    const RENDERED_LINES_ID = "renderedLines";
    const LINE_CLASS = "line";

    const LINE_DELIMITER = "\n\n";

    require.config({
        paths: {
            ace: "./ace/lib/ace",
        }
    });

    // NB: MathJax doesn't really.. do anything with RequireJS. You can run it
    // under RequireJs, but it still just defines its stuff under
    // `window.MathJax`, not with a `requirejs.define`.  ¯\_(ツ)_/¯
    const MATHJAX_URL = "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=AM_HTMLorMML&delayStartupUntil=configured";
    require([MATHJAX_URL, "./js/lz-string.min.js", "./js/firebase.js", "./js/draw.js", "ace/ace"], function(_, LZString, firebase, draw, ace) {
        const $renderedLines = document.getElementById(RENDERED_LINES_ID);
        let lineElements = [];

        let toBeLoadedByDefault = { math: '', imageString: '' };

        const loadMath = async () => {
            //editor.session.setValue("Loading math from URL...");
            editor.setReadOnly(true);

            var savedMath;
            if (window.location.hash.startsWith("#fullmath:")) {
                /*
                this is for backwards compat
                in older versions of mathpaste, all of the math was compressed in the url
                in this version of mathpaste, loading those urls is still supported
                */
                const encodedMath = window.location.hash.substr("#fullmath:".length);
                savedMath = { math: LZString.decompressFromEncodedURIComponent(encodedMath), imageString: '' };
            } else if (window.location.hash.startsWith("#saved:")) {
                const mathId = window.location.hash.substr("#saved:".length);
                savedMath = await firebase.get(mathId);
            } else if (toBeLoadedByDefault !== null) {
                savedMath = toBeLoadedByDefault;
                toBeLoadedByDefault = null;   // this shouldn't be used anymore after this
            } else {
                savedMath = { math: '', imageString: '' };
            };

            console.log(savedMath);
            editor.session.setValue(savedMath.math);
            draw.setImageString(savedMath.imageString);

            editor.setReadOnly(false);
            renderLines();
        };

        const saveMath = async () => {
            const mathId = await firebase.post(editor.getValue(), draw.getImageString());
            $shareBoxInput.value = window.location.origin + window.location.pathname + "#saved:" + mathId;
            window.location.hash = "#saved:" + mathId;
        };

        let oldLines = [];
        const renderLines = () => {
            const lines = editor.getValue().split(LINE_DELIMITER);

            for (let i = 0; i < lines.length; ++i) {
                if (oldLines[i] === lines[i]) {
                    continue;
                }

                if (lineElements.length <= i) {
                    const $line = document.createElement("div");
                    $line.classList.add(LINE_CLASS);
                    lineElements.push($line);
                    $renderedLines.append($line);
                }

                lineElements[i].textContent = "`" + lines[i] + "`";
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, lineElements[i]]);
            }

            const extraLines = lineElements.length - lines.length;
            for (let i = lineElements.length - extraLines; i < lineElements.length; ++i) {
                lineElements[i].textContent = "";
            }

            oldLines = lines;
        };

        // this is for mathpaste-gtk
        window.mathpaste = {
            getMathAndImage() {
                return {
                    math: editor.getValue(),
                    imageString: draw.getImageString(),
                    imageDataUrl: draw.getDataUrl()
                };
            },
            setMathAndImage(math, imageString) {
                if (toBeLoadedByDefault === null) {
                    // loadMath has ran already
                    editor.session.setValue(math);
                    draw.setImageString(imageString);
                } else {
                    toBeLoadedByDefault.math = math;
                    toBeLoadedByDefault.imageString = imageString;
                }
            }
        };

        let editor = ace.edit("editor", {
            mode: "ace/mode/asciimath",
            theme: "ace/theme/tomorrow_night_eighties",
            selectionStyle: "text",
            showLineNumbers: false,
            showGutter: false,
            wrap: true,
        });
        editor.setAutoScrollEditorIntoView(true);

        const onSomethingChanged = () => {
            // location.hash should be rest when the math or the drawing no
            // longer matches what's in firebase, but that must not happen
            // while loadMath is running
            if (!editor.getReadOnly()) {
                window.location.hash = "";
            }
        };

        editor.session.on("change", () => {
            onSomethingChanged();
            renderLines();
        });
        draw.addDrawingCallback(onSomethingChanged);

        const $infoButton = document.getElementById("info-button");
        const $infoBox = document.getElementById("info-box");
        const $drawButton = document.getElementById("draw-button");
        const $drawBox = document.getElementById("draw-box");
        const $shareButton = document.getElementById("share-button");
        const $shareBox = document.getElementById("share-box");
        const $shareBoxInput = document.getElementById("share-url");
        const boxes = [$infoBox, $drawBox, $shareBox];
        const shouldNotCloseBoxes = [$infoBox, $drawBox, $shareBox, $infoButton, $drawButton, $shareButton];


        $infoButton.addEventListener("click", function() {
          boxes.forEach(box => box.classList.remove("shown"));
          $infoBox.classList.add("shown");
        });

        $drawButton.addEventListener("click", function() {
          boxes.forEach(box => box.classList.remove("shown"));
          $drawBox.classList.add("shown");
        });

        $shareButton.addEventListener("click", function() {
            boxes.forEach(box => box.classList.remove("shown"));
            $shareBox.classList.add("shown");
            saveMath();
        });

        document.addEventListener("click", function(e) {
          let element = e.target;
          let reachesABox = false;

          while (element) {
            if (!shouldNotCloseBoxes.every(el => el != element) ) { reachesABox = true; break; }
            element = element.parentElement;
          }

          console.info(reachesABox);

          if (!reachesABox) boxes.forEach(box => box.classList.remove("shown"));
        });

        // undoing that does the right thing with ace and the draw area
        delete editor.keyBinding.$defaultHandler.commandKeyBinding["ctrl-z"];
        document.addEventListener('keydown', event => {
            if (event.key == 'z' && event.ctrlKey) {
                if ($drawBox.classList.contains("shown")) {
                    draw.undo();
                } else {
                    editor.undo();
                }
            }
        });

        MathJax.Hub.Register.StartupHook("End", function() {
            MathJax.Hub.processSectionDelay = 0;
            loadMath();
        });
        MathJax.Hub.Configured();
    });
}());
