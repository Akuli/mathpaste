/* jshint browser: true, esnext: true */

(function() {
    "use strict";

    require.config({
        paths: {
            ace: "./ace/lib/ace",
        }
    });

    // NB: MathJax doesn't really.. do anything with RequireJS. You can run it
    // under RequireJs, but it still just defines its stuff under
    // `window.MathJax`, not with a `requirejs.define`.  ¯\_(ツ)_/¯
    const MATHJAX_URL = "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=AM_HTMLorMML&delayStartupUntil=configured";
    require([MATHJAX_URL, "./js/lz-string.min.js", "./js/firebase.js", "./js/draw.js", "./js/storage.js", "ace/ace"], (_, LZString, firebase, draw, storageManager, ace) => {
        const editor = ace.edit("editor", {
            mode: "ace/mode/asciimath",
            theme: "ace/theme/tomorrow_night_eighties",
            selectionStyle: "text",
            showLineNumbers: false,
            showGutter: false,
            wrap: true,
        });
        editor.setAutoScrollEditorIntoView(true);
        const lineElements = [];

        let toBeLoadedByDefault = { math: '', imageString: '' };

        const loadMath = async () => {
            //editor.session.setValue("Loading math from URL...");
            editor.setReadOnly(true);

            let savedMath;
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
            } else {
              const storagedMath = storageManager.get();
              if (storagedMath !== null) {
                savedMath = storagedMath;
              } else if (toBeLoadedByDefault !== null) {
                  savedMath = toBeLoadedByDefault;
                  toBeLoadedByDefault = null;   // this shouldn't be used anymore after this
              } else {
                  savedMath = { math: '', imageString: '' };
              }
            }

            console.log(savedMath);
            editor.session.setValue(savedMath.math);
            draw.setImageString(savedMath.imageString);

            editor.setReadOnly(false);
            renderLines();
        };

        const saveMath = async () => {
            const $saveBoxInput = document.getElementById("save-url");
            const mathId = await firebase.post(editor.getValue(), draw.getImageString());
            $saveBoxInput.value = window.location.origin + window.location.pathname + "#saved:" + mathId;
            window.location.hash = "#saved:" + mathId;
        };

        const $renderedLines = document.getElementById("renderedLines");

        function addLineElement() {
          const $line = document.createElement("div");
          $line.classList.add("line");
          lineElements.push($line);
          $renderedLines.append($line);
        }

        let oldLines = [];
        const renderLines = () => {
            const lines = editor.getValue().split("\n\n");

            for (let i = 0; i < lines.length; ++i) {
                if (oldLines[i] === lines[i]) {
                    continue;
                }

                if (lineElements.length <= i) {
                  addLineElement();
                }

                lineElements[i].textContent = "`" + lines[i] + "`";
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, lineElements[i]]);
            }

            for (let i = lines.length; i < lineElements.length; ++i) {
                lineElements[i].textContent = "";
            }

            oldLines = lines;
        };

        const changeCallbacks = [];
        let useLocalStorage = true;
        const onSomethingChanged = () => {
            // location.hash should be reset when the math or the drawing no
            // longer matches what's in firebase, but that must not happen
            // while loadMath is running
            if (!editor.getReadOnly()) {
                window.location.hash = "";

                for (let cb of changeCallbacks) {
                    cb();
                }
                if (useLocalStorage) {
                  storageManager.set(editor.getValue(), draw.getImageString());
                }
            }
        };

        editor.session.on("change", () => {
            onSomethingChanged();
            renderLines();
        });
        draw.addDrawingCallback(onSomethingChanged);

        editor.selection.on('changeCursor', () => {
          for (const elem of lineElements) {
            elem.classList.remove('selected');
          }

          const cursorLine = editor.getCursorPosition().row;   // 0 means first row
          const linesAboveOrAtCursor = editor.getValue().split('\n').slice(0, cursorLine+1);
          const howManyDoubleNewlinesBeforeCursor = linesAboveOrAtCursor.join('\n').split('\n\n').length - 1;
          const lineElementToShow = lineElements[howManyDoubleNewlinesBeforeCursor];

          if (lineElementToShow !== undefined) {   // I don't know when this would happen
            const scrollOptions = { scrollMode: 'if-needed' };
            if (navigator.userAgent.toLowerCase().indexOf('firefox') === -1) {
              // this causes annoying and weird behaviour in firefox
              // try adding 1/2+3/4+5/6 and backspacing it away
              scrollOptions.behavior = 'smooth';
            }

            // https://www.npmjs.com/package/scroll-into-view-if-needed
            // there's a script tag that loads this in index.html
            window.scrollIntoView(lineElementToShow, scrollOptions);

            lineElementToShow.classList.add('selected');
          }
        });

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
                editor.setReadOnly(true);
                if (toBeLoadedByDefault === null) {
                    // loadMath has ran already
                    editor.session.setValue(math);
                    draw.setImageString(imageString);
                } else {
                    toBeLoadedByDefault.math = math;
                    toBeLoadedByDefault.imageString = imageString;
                }
                editor.setReadOnly(false);
            },
            loadMathFromWindowDotLocationDotHash() {
                toBeLoadedByDefault = null;
                loadMath();
            },
            addChangeCallback(cb) {
                changeCallbacks.push(cb);
            },
            setUseLocalStorage(bool) {
                useLocalStorage = !!bool;
            }
        };

        const $infoButton = document.getElementById("info-button");
        const $drawButton = document.getElementById("draw-button");
        const $saveButton = document.getElementById("save-button");
        const $infoBox = document.getElementById("info-box");
        const $drawBox = document.getElementById("draw-box");
        const $saveBox = document.getElementById("save-box");

        const boxes = [$infoBox, $drawBox, $saveBox];
        const buttons = [$infoButton, $drawButton, $saveButton];

        const showBox = box => {
          for (let otherBox of boxes) {
            otherBox.classList.remove("shown");
          }

          // TODO: toggle if the same button is clicked many times
          box.classList.add("shown");
        };

        $infoButton.addEventListener("click", () => showBox($infoBox));
        $drawButton.addEventListener("click", () => showBox($drawBox));
        $saveButton.addEventListener("click", () => {
          showBox($saveBox);
          saveMath();
        });

        document.addEventListener("click", e => {
          let element = e.target;
          let reachesABox = false;

          while (element) {
            if (boxes.concat(buttons).includes(element)) {
              reachesABox = true;
              break;
            }
            element = element.parentElement;
          }
          if (!reachesABox) {
            for (let box of boxes) {
              box.classList.remove("shown");
            }
          }
        });

        // undoing that does the right thing with ace and the draw area
        delete editor.keyBinding.$defaultHandler.commandKeyBinding["ctrl-z"];
        document.addEventListener('keydown', event => {
            if (event.key === 'z' && event.ctrlKey) {
                if ($drawBox.classList.contains("shown")) {
                    draw.undo();
                } else {
                    editor.undo();
                }
            }
        });

        MathJax.Hub.Register.StartupHook("End", () => {
            MathJax.Hub.processSectionDelay = 0;
            loadMath();
        });
        MathJax.Hub.Configured();
    });
}());
