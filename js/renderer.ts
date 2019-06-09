import { default as scrollIntoView, Options } from "scroll-into-view-if-needed";

// TODO(akuli): myst's code used to lazy-load this, so maybe add that back?
import * as markedTs from 'marked-ts';

import { RadioClassManager } from "./utils";
import * as consts from './consts';


class MathpasteMarkdownRenderer extends markedTs.Renderer {
  // markdown like `x^2=1` runs this
  // the ` characters that this returns are used by mathjax
  codespan(text: string): string {
    return '`' + text + '`';
  }
}

// I have no idea why marked-ts uses global options instead of setting the
// options on a markdown parser instance or something
markedTs.Marked.setOptions({renderer: new MathpasteMarkdownRenderer});


export default class Renderer {
  /* TODO(akuli): is the [] shared by all instances like it would be in a python class
  variable? it doesn't matter if it is because there's only 1 Renderer object
  used, but what if more Renderer objects are created in a later version of
  mathpaste for whatever reason? could cause a somewhat hard-to-debug bug
  */
  private oldLines: string[] = [];

  private elements: HTMLElement[] = [];
  private lineContainer: HTMLElement;

  private selectedManager: RadioClassManager = new RadioClassManager("selected");

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

    let needsMathjax: bool;
    if (line.startsWith(consts.TEXT_PREFIX)) {
      line = line.substr(consts.TEXT_PREFIX.length);
      // XXX(PurpleMyst): Are the next two lines slow enough that we have to use `setImmediate`?
      // akuli: the first of those 2 lines is gone now, it used to be `await import("marked-ts");`
      lineElement.innerHTML = markedTs.Marked.parse(line);
      needsMathjax = (line.indexOf('`') !== -1);
    } else {
      lineElement.textContent = "`" + line + "`";
      needsMathjax = true;
    }

    if (needsMathjax) {
      MathJax.Hub.Queue(["Typeset", MathJax.Hub, lineElement]);
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
