import { default as scrollIntoView, Options } from "scroll-into-view-if-needed";

import { RadioClassManager } from "./utils";

import { LITERATE_PREFIX } from "./consts";

export default class Renderer {
  private literate: boolean = false;

  private oldLines: string[] = [];

  private elements: HTMLElement[] = [];
  private lineContainer: HTMLElement;

  private selectedManager: RadioClassManager = new RadioClassManager("selected");

  constructor(lineContainerId: string) {
    this.lineContainer = document.getElementById(lineContainerId)!;
  }

  makeLiterate() {
    this.literate = true;
    this.oldLines = [];
  }

  private insertNewLineElement(idx: number) {
    const lineElement = document.createElement("div");
    lineElement.classList.add("line");

    if (idx === this.elements.length) {
      this.elements.push(lineElement);
      this.lineContainer.append(lineElement);
    } else {
      this.lineContainer.insertBefore(lineElement, this.lineContainer.children[idx]);
      this.elements.splice(idx, 0, lineElement);
    }
  }

  private removeLineElement(idx: number) {
    const [lineElement] = this.elements.splice(idx, 1);
    this.lineContainer.removeChild(lineElement);
  }

  private async renderLine(line: string, idx: number) {
    const lineElement = this.elements[idx];

    if (!this.literate || line.startsWith(LITERATE_PREFIX)) {
      line = line.substr(LITERATE_PREFIX.length);
      lineElement.textContent = "`" + line + "`";
      MathJax.Hub.Queue(["Typeset", MathJax.Hub, lineElement]);
    } else {
      // XXX: Are the next two lines slow enough that we have to use `setImmediate`?
      const marked = await import("marked-ts");
      lineElement.innerHTML = marked.Marked.parse(line);
    }
  }

  async render(contents: string) {
    const newLines = contents.split("\n\n");
    const diff = await import(/* webpackPreload: true */ "diff");

    let lineIndex = 0;
    for (const change of diff.diffArrays(this.oldLines, newLines)) {
      for (const line of change.value) {
        if (change.added) {
          this.insertNewLineElement(lineIndex);
          this.renderLine(line, lineIndex);
        } else if (change.removed) {
          this.removeLineElement(lineIndex);
          continue;
        }

        lineIndex += 1;
      }
    }

    this.oldLines = newLines;
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
