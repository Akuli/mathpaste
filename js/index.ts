import * as storageManager from "./storage";
import { CanvasManager } from "./canvasmanager";
import Editor from "./editor";
import Renderer from "./renderer";
import PasteManager from "./pasteManager";
import { RadioClassManager } from "./utils";
import { TEXT_PREFIX } from "./consts";

// files included in the output
import "../index.html";
import "../css/index.css";
import "../pics/circle.png";
import "../pics/filled-circle.png";
import "../pics/info.png";
import "../pics/line.png";
import "../pics/pen.png";
import "../pics/save.png";

const editor = new Editor("editor", {
  selectionStyle: "text",
  showLineNumbers: false,
  showGutter: false,
  wrap: true,
  theme: "ace/theme/tomorrow_night_eighties",
  mode: "ace/mode/asciimath",
});
const cm = new CanvasManager("draw-canvas");
const pm = new PasteManager();
const render = new Renderer("renderedLines");

cm.on("change", () => storageManager.setImageString(cm.getImageString()));

editor.on("change", (_, isUserInput) => {
  if (isUserInput) window.location.hash = "";
});

editor.on("change", async (contents: string) => {
  if (contents.split("\n\n").some(line => line.startsWith(TEXT_PREFIX))) {
    await import("./modes/literate_asciimath");
    editor.setMode("ace/mode/literate_asciimath");
  }
});

let useLocalStorage = true;
editor.on("change", (newMath, isUserInput) => {
  if (!useLocalStorage || !isUserInput) return;
  storageManager.setMath(newMath);
});

editor.on("change", () => render.render(editor.contents));

editor.on("cursorMoved", () => render.selectLine(editor.getRenderedLineIndex()));

// this is for mathpaste-gtk
(window as any).mathpaste = {
  getMathAndImage() {
    return {
      math: editor.contents,
      imageString: cm.getImageString(),
      imageDataUrl: cm.getDataUrl(),
    };
  },

  setMathAndImage(newMath: string, newImageString: string) {
    editor.contents = newMath;
    cm.setImageString(newImageString);
  },

  async loadMathFromWindowDotLocationDotHash() {
    const { math, imageString } = await pm.loadPaste();
    editor.contents = math || "";
    cm.setImageString(imageString || "");
  },

  addChangeCallback(cb: () => void) {
    editor.on("change", cb);
  },

  setUseLocalStorage(bool: boolean) {
    useLocalStorage = bool;
  },
};

const shownBoxManager = new RadioClassManager("shown");
const createBox = (prefix: string) => {
  const boxElement = document.getElementById(`${prefix}-box`)!;
  const buttonElement = document.getElementById(`${prefix}-button`)!;

  // Prevent the "remove shown" document event listener from being ran
  boxElement.addEventListener("click", e => e.stopPropagation());
  buttonElement.addEventListener("click", e => e.stopPropagation());

  // Prevent random vertices from appearing in the draw area
  buttonElement.addEventListener("mouseup", e => e.stopPropagation());

  buttonElement.addEventListener("click", () => shownBoxManager.toggleClass(boxElement));

  return { boxElement, buttonElement };
};

const boxes = {
  info: createBox("info"),
  draw: createBox("draw"),
  save: createBox("save"),
};

shownBoxManager.on("change", () => (cm.readOnly = !shownBoxManager.hasClass(boxes.draw.boxElement)));

/*
if you think that you can do this in some other way, you are likely wrong.

Myst tried to do it 2 times, and both failed. The issues were difficult to
reproduce. For example, last time I wrote something to the editor, then opened
the draw area. I pressed ctrl+z, and it undid in the draw area as expected.
Then I pressed ctrl+z again and it undid in the editor instead of the draw
area, even though the draw area was open and I hadn't touched the editor in any
way (wtf). The bug reproduced many times again, so to undo many times in the
draw area, I had to open the draw area, ctrl+z, close draw are, open draw area,
ctrl+z, close draw area etc many times. A little while later I tried the same
thing again and I couldn't reproduce the problem (wut).

PLEASE DON'T REWRITE THIS VERY DIFFERENTLY unless you truly understand what is
going on, unlike anyone else who has worked on mathpaste so far!
*/
editor.deleteKeybinding("ctrl-z");
document.addEventListener("keydown", event => {
  if (event.key === "z" && event.ctrlKey) {
    if (shownBoxManager.hasClass(boxes.draw.boxElement)) {
      cm.undo();
    } else {
      editor.undo();
    }
  }
});

boxes.save.buttonElement.addEventListener("click", async () => {
  const pasteId = await pm.uploadPaste(editor.contents, cm.getImageString());
  const $saveBoxInput = document.getElementById("save-url")! as HTMLInputElement;
  $saveBoxInput.value = window.location.origin + window.location.pathname + "#saved:" + pasteId;
  window.location.hash = "#saved:" + pasteId;
});

document.addEventListener("click", () => shownBoxManager.removeClass());

MathJax.Hub.Register.StartupHook("End", async () => {
  MathJax.Hub.processSectionDelay = 0;

  editor.readOnly = true;
  cm.readOnly = true;

  const { math, imageString } = await pm.loadPaste();
  editor.contents = math || "";
  cm.setImageString(imageString || "");

  editor.readOnly = false;
});
MathJax.Hub.Configured();
