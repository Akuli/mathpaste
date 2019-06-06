import { default as scrollIntoView, Options } from "scroll-into-view-if-needed";

import { RadioClassManager } from "./utils";

import { Marked } from "marked-ts";

const LITERATE_MATH_PREFIX: string = "> ";

export default class Renderer {
  private literate: boolean = window.location.search === "?literate";

  private oldLines: string[] = [];

  private elements: HTMLElement[] = [];
  private lineContainer: HTMLElement;

  private selectedManager: RadioClassManager = new RadioClassManager("selected");

  constructor(lineContainerId: string) {
    this.lineContainer = document.getElementById(lineContainerId)!;
  }

  getMathLine(line: string): string | null {
    if (!this.literate) return line;

    if (!line.startsWith(LITERATE_MATH_PREFIX)) return null;

    return line.substr(LITERATE_MATH_PREFIX.length);
  }

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

      const mathLine = this.getMathLine(lines[i]);
      if (mathLine !== null) {
        this.elements[i].textContent = "`" + mathLine + "`";
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.elements[i]]);
      } else {
        this.elements[i].innerHTML = Marked.parse(lines[i]);
      }
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
