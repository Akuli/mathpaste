import CanvasManager from "./draw";
import Editor from "./editor";
import PasteManager from "./pasteManager";
import Renderer from "./renderer";
import * as storageManager from "./storage";
import { RadioClassManager } from "./utils";

// files included in the output
import "../css/index.css";
import "../index.html";
import "../pics/circle.png";
import "../pics/info.png";
import "../pics/line.png";
import "../pics/pen.png";
import "../pics/save.png";

const editor = new Editor();
const cm = new CanvasManager();
const pm = new PasteManager();
const render = new Renderer();

cm.on("change", () => storageManager.setImageString(cm.getImageString()));

editor.on("change", (_, isUserInput) => {
  if (isUserInput) window.location.hash = "";
});

let useLocalStorage = true;
editor.on("change", (newMath, isUserInput) => {
  if (!useLocalStorage || !isUserInput) return;
  storageManager.setMath(newMath);
});

editor.on("change", () => render.render(editor.getContents()));

editor.on("cursorMoved", () => render.selectLine(editor.getActualLineIndex()));

// this is for mathpaste-gtk
(window as any).mathpaste = {
  getMathAndImage() {
    return {
      imageDataUrl: cm.getDataUrl(),
      imageString: cm.getImageString(),
      math: editor.getContents(),
    };
  },

  setMathAndImage(newMath: string, newImageString: string) {
    editor.setContents(newMath);
    cm.setImageString(newImageString);
  },

  async loadMathFromWindowDotLocationDotHash() {
    const { math, imageString } = await pm.loadPaste();
    editor.setContents(math || "");
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
  const boxElement = document.getElementById(`${prefix}-box`);
  const buttonElement = document.getElementById(`${prefix}-button`);

  if (boxElement === null || buttonElement === null) { throw new Error(); }

  // Prevent the "remove shown" document event listener from being ran
  boxElement.addEventListener("click", (e) => e.stopPropagation());
  buttonElement.addEventListener("click", (e) => e.stopPropagation());

  buttonElement.addEventListener("click", () => shownBoxManager.toggleClass(boxElement));

  return { boxElement, buttonElement };
};

createBox("info");

createBox("draw").boxElement.addEventListener("keydown", (event) => {
  if (event.key === "z" && event.ctrlKey) {
    cm.undo();
  }
});

createBox("save").buttonElement.addEventListener("click", async () => {
  const pasteId = await pm.uploadPaste(editor.getContents(), cm.getImageString());
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
  editor.setContents(math || "");
  cm.setImageString(imageString || "");

  editor.readOnly = false;
  cm.readOnly = false;
});
MathJax.Hub.Configured();
