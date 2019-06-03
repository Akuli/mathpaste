/* jshint browser: true, unused: true, module: true, esversion: 8 */
/* globals MathJax */

import * as storageManager from "./storage";
import CanvasManager from "./draw";
import Editor from "./editor";
import Renderer from "./renderer";
import PasteManager from "./pasteManager";

// files included in the output
import "../index.html";
import "../css/index.css";

const editor = new Editor();
const cm = new CanvasManager();
const pm = new PasteManager();
const render = new Renderer(editor);

cm.on("change", () => {
  storageManager.setImageString(cm.getImageString());
});

editor.on("change", (_, isUserInput) => {
  if (isUserInput) window.location.hash = "";
});

let useLocalStorage = true;
editor.on("change", (newMath, isUserInput) => {
  if (!useLocalStorage || !isUserInput) return;
  storageManager.setMath(newMath);
});

editor.on("change", () => {
  render.render();
});

editor.on("cursorMoved", () => {
  render.selectLine(editor.getActualLineIndex());
});

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

const boxes = [];
const createBox = (type) => {
  const boxElement = document.getElementById(`${type}-box`);
  const buttonElement = document.getElementById(`${type}-button`);

  // Prevent the "remove shown" document event listener from being ran
  boxElement.addEventListener("click", e => void e.stopPropagation());
  buttonElement.addEventListener("click", e => void e.stopPropagation());

  buttonElement.addEventListener("click", () => {
    for (let otherBox of boxes) {
      otherBox.classList.remove("shown");
    }

    // TODO: toggle if the same button is clicked many times
    boxElement.classList.add("shown");
  });
  boxes.push(boxElement);

  return { boxElement, buttonElement };
};

createBox("info");
createBox("draw");
createBox("save").buttonElement.addEventListener("click", async () => {
  const pasteId = await pm.uploadPaste(editor.getContents(), cm.getImageString());
  const $saveBoxInput = document.getElementById("save-url");
  $saveBoxInput.value = window.location.origin + window.location.pathname + "#saved:" + pasteId;
  window.location.hash = "#saved:" + pasteId;
});

document.addEventListener("click", () => {
  boxes.forEach(box => box.classList.remove("shown"));
});

MathJax.Hub.Register.StartupHook("End", async () => {
  MathJax.Hub.processSectionDelay = 0;

  const { math, imageString } = await pm.loadPaste();
  editor.setContents(math);
  cm.setImageString(imageString);
});
MathJax.Hub.Configured();
