import { default as scrollIntoView, Options } from "scroll-into-view-if-needed";

import { RadioClassManager } from "./utils";

export default class Renderer {
  private oldLines: string[] = [];

  private elements: HTMLElement[] = [];
  private lineContainer: HTMLElement = document.getElementById("renderedLines")!;

  private selectedManager: RadioClassManager = new RadioClassManager("selected");

  render(contents: string) {
    const lines = contents.split("\n\n");

    for (let i = 0; i < lines.length; ++i) {
      if (this.oldLines[i] === lines[i]) {
        continue;
      }

      if (this.elements.length <= i) {
        const $line = document.createElement("div");
        $line.classList.add("line");
        this.elements.push($line);
        this.lineContainer.append($line);
      }

      this.elements[i].textContent = "`" + lines[i] + "`";
      MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.elements[i]]);
    }

    for (let i = lines.length; i < this.elements.length; ++i) {
      this.elements[i].textContent = "";
    }

    this.oldLines = lines;
  }

  selectLine(index: number) {
    const lineElementToShow = this.elements[index];

    if (lineElementToShow === undefined) return;

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

    this.selectedManager.addClass(lineElementToShow);
  }
}
