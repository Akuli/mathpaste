import { CanvasManager, DrawingTool, Rubber } from "./canvasmanager";
import { Editor, ChangeType } from "./editor";
import Renderer from "./renderer";
import PasteManager from "./pasteManager";
import { RadioClassManager } from "./utils";
import { TEXT_PREFIX } from "./consts";

import { Pen, StraightLine } from "./drawobjects/pen";
import { Circle } from "./drawobjects/circle";

// files included in the output
import "../index.html";
import "../css/index.css";
import "../pics/circle.png";
import "../pics/filled-circle.png";
import "../pics/line.png";
import "../pics/pen.png";
import "../pics/trash.png";
import "../pics/1x1-transparent.png";

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

const query = new URLSearchParams(window.location.search);
if (query.has("vim")) {
  import("ace-builds/src-min-noconflict/keybinding-vim").then(() => {
    editor.keyboardHandler = "ace/keyboard/vim";
  });
}

cm.initToolButtons({
  "draw-pen-button": new DrawingTool((point, color) => new Pen(point, color)),
  "draw-circle-button": new DrawingTool((point, color) => new Circle(point, color)),
  "draw-filled-circle-button": new DrawingTool((point, color) => new Circle(point, color, true)),
  "draw-line-button": new DrawingTool((point, color) => new StraightLine(point, color)),
  "draw-rubber-button": new Rubber(),
});
cm.initColorButtons(
  Array.from(document.getElementsByClassName("color-button")).map(b => b as HTMLButtonElement));
cm.initClearButton(document.getElementById("clear-button")! as HTMLButtonElement);

document.getElementById("draw-pen-button")!.click();
document.getElementById("draw-default-color-button")!.click();

cm.on("change", () => pm.saveImageString(cm.getImageString()));

editor.on("change", (_, changeType) => {
  if (changeType === ChangeType.UserInput) window.location.hash = "";
});

cm.on("change", () => { window.location.hash = ""; });

editor.on("change", async (contents: string) => {
  if (contents.split("\n\n").some(line => line.startsWith(TEXT_PREFIX))) {
    await import("./modes/literate_asciimath");
    editor.mode = "ace/mode/literate_asciimath";
  }
});

let useLocalStorage = true;
editor.on("change", (newMath, changeType) => {
  if (!useLocalStorage || changeType !== ChangeType.UserInput) return;
  pm.saveMath(newMath);
});

const render = new Renderer("renderedLines", () => editor.contents, () => editor.getRenderedLineIndex());
editor.on("change", () => render.render());
editor.on("cursorMoved", () => render.highlightLine());

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

  buttonElement.addEventListener("click", () => shownBoxManager.toggleClass(boxElement));

  return { boxElement, buttonElement };
};

const boxes = {
  info: createBox("info"),
  draw: createBox("draw"),
  save: createBox("save"),
};

/*
 * To avoid browser-compatibility shenanigans and the like, we chose to avoid
 * ace's handling of Ctrl-Z and instead register our own, document-level,
 * handler that takes into account the currently shown box.
 *
 * Though the resulting code may look simple, the process that it took us to
 * arrive at it was not. *Please* if you come across this code and desire to
 * change it, make sure you understand the nuances of both DOM events and how
 * ace itself works.
 */
editor.addKeyFilter((event) => event.key === "z" && event.ctrlKey);
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
  window.location.hash = await pm.uploadPaste({
    math: editor.contents,
    imageString: cm.getImageString(),
  });
  (document.getElementById("save-url")! as HTMLInputElement).value = window.location.href;
});

document.addEventListener("click", () => shownBoxManager.removeClass());

editor.readOnly = true;
cm.readOnly = true;

MathJax.Hub.Register.StartupHook("End", async () => {
  MathJax.Hub.processSectionDelay = 0;
  try {
    const { math, imageString } = await pm.loadPaste();
    editor.contents = math || "";
    cm.setImageString(imageString || "");
  } finally {
    editor.readOnly = false;
    cm.readOnly = false;
  }
});
MathJax.Hub.Configured();
