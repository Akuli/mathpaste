import { default as scrollIntoView, Options } from "scroll-into-view-if-needed";

import { RadioClassManager } from "./utils";
import { TEXT_PREFIX } from "./consts";

export default class Renderer {
  /* this is created per-instance */
  private oldLines: string[] = [];

  private elements: HTMLElement[] = [];
  private lineContainer: HTMLElement;

  private selectedManager: RadioClassManager = new RadioClassManager("selected");
  private markedImported: boolean = false;

  constructor(lineContainerId: string) {
    this.lineContainer = document.getElementById(lineContainerId)!;
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

    if (line.startsWith(TEXT_PREFIX)) {
      const marked = await import("marked-ts");

      if (!this.markedImported) {
        marked.Marked.setOptions({
          renderer: new (class extends marked.Renderer {
            // markdown like `x^2=1` runs this
            // the ` characters that this returns are used by mathjax
            codespan(text: string): string {
              return "`" + text + "`";
            }
          })(),
        });

        this.markedImported = true;
      }

      line = line.substr(TEXT_PREFIX.length);
      lineElement.innerHTML = marked.Marked.parse(line);

      // if the line contains `, we can render it as math
      if (line.indexOf("`") === -1) return;
    } else {
      lineElement.textContent = "`" + line + "`";
    }

    MathJax.Hub.Queue(["Typeset", MathJax.Hub, lineElement]);
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
    // XXX(PurpleMyst): I'm not sure what Akuli meant with this comment. Behavior seems
    // reasonable to me on the latest friefox.
    //
    // akuli: I might have had an old version of firefox. I talked with myst,
    // and he is a firefox user and he doesn't like smooth scrolling, and I do
    // like smooth scrolling but not firefox, so this is good anyway :D
    if (navigator.userAgent.toLowerCase().indexOf("firefox") === -1) {
      // this causes annoying and weird behaviour in firefox
      // try adding 1/2+3/4+5/6 and backspacing it away
      scrollOptions.behavior = "smooth";
    }

    scrollIntoView(lineElementToShow, scrollOptions);

    this.selectedManager.addClass(lineElementToShow);
  }
}
