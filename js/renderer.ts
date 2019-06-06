import { default as scrollIntoView, Options } from "scroll-into-view-if-needed";

import { RadioClassManager } from "./utils";

export default class Renderer {
  _oldLines: string[] = [];
  _elements: HTMLElement[] = [];
  _linesOutput: HTMLElement = document.getElementById("renderedLines")!;
  _selectedManager: RadioClassManager = new RadioClassManager("selected");

  render(contents: string) {
    const lines = contents.split("\n\n");

    for (let i = 0; i < lines.length; ++i) {
      if (this._oldLines[i] === lines[i]) {
        continue;
      }

      if (this._elements.length <= i) {
        const $line = document.createElement("div");
        $line.classList.add("line");
        this._elements.push($line);
        this._linesOutput.append($line);
      }

      this._elements[i].textContent = "`" + lines[i] + "`";
      MathJax.Hub.Queue(["Typeset", MathJax.Hub, this._elements[i]]);
    }

    for (let i = lines.length; i < this._elements.length; ++i) {
      this._elements[i].textContent = "";
    }

    this._oldLines = lines;
  }

  selectLine(index: number) {
    const lineElementToShow = this._elements[index];

    // I don't know when this would happen
    if (!lineElementToShow) return;

    const scrollOptions: Options = { scrollMode: "if-needed" };

    // FIXME: detect the feature not the user agent
    // XXX: I'm not sure what Akuli meant with this comment. Behavior seems
    // reasonable to me on the latest friefox.
    if (navigator.userAgent.toLowerCase().indexOf("firefox") === -1) {
      // this causes annoying and weird behaviour in firefox
      // try adding 1/2+3/4+5/6 and backspacing it away
      scrollOptions.behavior = "smooth";
    }

    scrollIntoView(lineElementToShow, scrollOptions);

    this._selectedManager.addClass(lineElementToShow);
  }
}
