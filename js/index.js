import * as storageManager from "./storage";
import CanvasManager from "./draw";
import Editor from "./editor";
import Renderer from "./renderer";
import PasteManager from "./pasteManager";
import { RadioClassManager } from "./utils";

// files included in the output
import "../index.html";
import "../css/index.css";
import "../pics/circle.png";
import "../pics/info.png";
import "../pics/line.png";
import "../pics/pen.png";
import "../pics/save.png";

const editor = new Editor();
const cm = new CanvasManager();
const pm = new PasteManager();
const render = new Renderer();

cm.on("change", () => void storageManager.setImageString(cm.getImageString()));

editor.on("change", (_, isUserInput) => {
  if (isUserInput) window.location.hash = "";
});

let useLocalStorage = true;
editor.on("change", (newMath, isUserInput) => {
  if (!useLocalStorage || !isUserInput) return;
  storageManager.setMath(newMath);
});

editor.on("change", () => void render.render(editor.getContents()));

editor.on("cursorMoved", () => void render.selectLine(editor.getActualLineIndex()));

// this is for mathpaste-gtk
window.mathpaste = {
  getMathAndImage() {
    return {
      math: editor.getContents(),
      imageString: cm.getImageString(),
      imageDataUrl: cm.getDataUrl()
    };
  },

  setMathAndImage(newMath, newImageString) {
    // FIXME: Did the `toBeLoadedByDefault === null` case ever happen?
    editor.setContents(newMath);
    cm.setImageString(newImageString);
  },

  async loadMathFromWindowDotLocationDotHash() {
    const { math, imageString } = await pm.loadPaste();
    editor.setContents(math);
    cm.setImageString(imageString);
  },

  addChangeCallback(cb) {
    editor.on("change", cb);
  },

  setUseLocalStorage(bool) {
    useLocalStorage = !!bool;
  }
};

const shownBoxManager = new RadioClassManager("shown");
const createBox = (type) => {
  const boxElement = document.getElementById(`${type}-box`);
  const buttonElement = document.getElementById(`${type}-button`);

  // Prevent the "remove shown" document event listener from being ran
  boxElement.addEventListener("click", e => void e.stopPropagation());
  buttonElement.addEventListener("click", e => void e.stopPropagation());

  buttonElement.addEventListener("click", () => void shownBoxManager.toggleClass(boxElement));

  return { boxElement, buttonElement };
};

createBox("info");
createBox("draw").boxElement.addEventListener("keydown", event => {
  if (event.key === "z" && event.ctrlKey) {
    cm.undo();
  }
});
createBox("save").buttonElement.addEventListener("click", async () => {
  const pasteId = await pm.uploadPaste(editor.getContents(), cm.getImageString());
  const $saveBoxInput = document.getElementById("save-url");
  $saveBoxInput.value = window.location.origin + window.location.pathname + "#saved:" + pasteId;
  window.location.hash = "#saved:" + pasteId;
});

document.addEventListener("click", () => void shownBoxManager.removeClass());

MathJax.Hub.Register.StartupHook("End", async () => {
  MathJax.Hub.processSectionDelay = 0;

  editor.readOnly = true;
  cm.readOnly = true;

  const { math, imageString } = await pm.loadPaste();
  editor.setContents(math);
  cm.setImageString(imageString);

  editor.readOnly = false;
  cm.readOnly = false;
});
MathJax.Hub.Configured();
