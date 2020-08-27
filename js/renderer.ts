import scrollIntoView, { Options } from "scroll-into-view-if-needed";

import { RadioClassManager, RunOnceAtATime } from "./utils";
import { TEXT_PREFIX } from "./consts";

export default class Renderer {
  /* this is created per-instance */
  private oldLines: string[] = [];

  private elements: HTMLElement[] = [];
  private lineContainer: HTMLElement;

  private selectedManager: RadioClassManager = new RadioClassManager("selected");
  private markedImported: boolean = false;

  private renderRunner: RunOnceAtATime;

  constructor(lineContainerId: string, getContentsAndLineToHighlight: () => [string, number]) {
    this.lineContainer = document.getElementById(lineContainerId)!;
    this.renderRunner = new RunOnceAtATime(async() => await this.renderRaw(...getContentsAndLineToHighlight()));
  }

  async render() {
    await this.renderRunner.run();
  }

  private insertNewLineElement(idx: number): HTMLElement {
    const lineElement = document.createElement("div");
    lineElement.classList.add("line");

    if (idx === this.elements.length) {
      this.elements.push(lineElement);
      this.lineContainer.append(lineElement);
    } else {
      this.lineContainer.insertBefore(lineElement, this.lineContainer.children[idx]);
      this.elements.splice(idx, 0, lineElement);
    }

    return lineElement;
  }

  private removeLineElement(idx: number) {
    const [lineElement] = this.elements.splice(idx, 1);
    this.lineContainer.removeChild(lineElement);
  }

  private async marked() {
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

    return marked;
  }

  private async renderLine(line: string, lineElement: HTMLElement) {
    if (line.startsWith(TEXT_PREFIX)) {
      const marked = await this.marked();

      line = line.substr(TEXT_PREFIX.length);
      lineElement.innerHTML = marked.Marked.parse(line);

      // if the line contains `, we can render it as math
      if (line.indexOf("`") === -1) return;
    } else {
      lineElement.textContent = "`" + line + "`";
    }

    return new Promise(resolve => MathJax.Hub.Queue(["Typeset", MathJax.Hub, lineElement, () => resolve()]));
  }

  private async renderRaw(contents: string, lineToHighlight: number): Promise<void> {
    const newLines = contents.split("\n\n");
    const diff = await import(/* webpackPreload: true */ "diff");

    let lineIndex = 0;
    for (const change of diff.diffArrays(this.oldLines, newLines)) {
      for (const line of change.value) {
        if (change.added) {
          await this.renderLine(line, this.insertNewLineElement(lineIndex));
        } else if (change.removed) {
          this.removeLineElement(lineIndex);
          continue;
        }

        // Do not place this in the `if (change.added)` branch because it is
        // possible for both `change.added` and `change.removed` to be falsy.
        lineIndex += 1;
      }
    }

    this.oldLines = newLines;
    this.highlightLine(lineToHighlight);
  }

  highlightLine(index: number) {
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
