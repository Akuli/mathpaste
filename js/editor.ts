import highlight from "./highlight";

import { StrictEventEmitter, offsetToPosition } from "./utils";

import "./modes/asciimath";

export enum ChangeType {
  UserInput,
  SetContents,
}

interface EditorEvents {
  change: (contents: string, changeType: ChangeType) => void;
}

// FIXME: theme: tomorrow_night_eighties
export class Editor extends StrictEventEmitter<EditorEvents>() {
  readonly element: HTMLDivElement;

  constructor() {
    super();

    this.element = document.getElementById("editor-text") as HTMLDivElement;
    this.element.addEventListener("input", () => this.emit("change", this.contents, ChangeType.UserInput));

    highlight(this);
  }

  get contents() {
    return this.element.innerText;
  }

  set contents(value: string) {
    this.element.innerText = value;
    this.emit("change", this.contents, ChangeType.SetContents);
  }

  get readOnly() {
    return !this.element.isContentEditable;
  }

  set readOnly(value) {
    this.element.contentEditable = (!value).toString();
  }

  private getCaretPosition() {
    const sel = window.getSelection();
    if (sel === null || sel.rangeCount !== 1) return null;
    const range = sel.getRangeAt(0);
    if (range.commonAncestorContainer.parentNode !== this.element) return null;

    return offsetToPosition(this.contents, range.endOffset);
  }

  getRenderedLineIndex() {
    const caret = this.getCaretPosition();
    if (caret === null) return null;
    return (
      this.contents
        .split("\n")
        .slice(0, caret.row + 1)
        .join("\n")
        .split("\n\n").length - 1
    );
  }
}
