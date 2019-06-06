import * as ace from "brace";
import "brace/theme/tomorrow_night_eighties";
import { EventEmitter } from "events";

import "./asciimath_acemode.ts";

export default class Editor extends EventEmitter {
  _editor: ace.Editor

  constructor() {
    super();

    this._editor = ace.edit("editor");
    this._editor.setOption("selectionStyle", "text");
    this._editor.setOption("showLineNumbers", false);
    this._editor.setOption("showGutter", false);
    this._editor.setOption("wrap", true);
    this._editor.setTheme("ace/theme/tomorrow_night_eighties");
    this._editor.getSession().setMode("ace/mode/asciimath");
    this._registerEventHandlers();
  }

  _registerEventHandlers() {
    const session = this._editor.getSession();

    session.on("change", () => void this.emit("change", this.getContents(), true));

    session.selection.on("changeCursor", () => void this.emit("cursorMoved", this._editor.getCursorPosition(), this.getContents()));
  }

  getContents() {
    return this._editor.getValue();
  }

  setContents(newContents: string) {
    this._editor.getSession().setValue(newContents || "");
    this.emit("change", this.getContents(), false);
  }

  get readOnly() {
    return this._editor.getReadOnly();
  }

  set readOnly(value) {
    this._editor.setReadOnly(value);
  }

  /**
   * Get the index of the actual line we're on.
   * By "actual line", we mean lines that are line-break separated, not ones
   * that are joined together in the output.
   */
  getActualLineIndex() {
    const { row } = this._editor.getCursorPosition();
    const linesAboveOrAtCursor = this.getContents().split("\n").slice(0, row + 1);
    return linesAboveOrAtCursor.join('\n').split('\n\n').length - 1;
  }
}
