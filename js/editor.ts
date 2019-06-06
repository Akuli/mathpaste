import * as ace from "brace";
import "brace/theme/tomorrow_night_eighties";
import { EventEmitter } from "events";

import "./asciimath_acemode.ts";

export default class Editor extends EventEmitter {
  private editor: ace.Editor

  constructor() {
    super();

    this.editor = ace.edit("editor");
    this.editor.setOption("selectionStyle", "text");
    this.editor.setOption("showLineNumbers", false);
    this.editor.setOption("showGutter", false);
    this.editor.setOption("wrap", true);
    this.editor.setTheme("ace/theme/tomorrow_night_eighties");
    this.editor.getSession().setMode("ace/mode/asciimath");
    this.registerEventHandlers();
  }

  private registerEventHandlers() {
    const session = this.editor.getSession();

    session.on("change", () => void this.emit("change", this.getContents(), true));

    session.selection.on("changeCursor", () => void this.emit("cursorMoved", this.editor.getCursorPosition(), this.getContents()));
  }

  getContents() {
    return this.editor.getValue();
  }

  setContents(newContents: string) {
    this.editor.getSession().setValue(newContents || "");
    this.emit("change", this.getContents(), false);
  }

  get readOnly() {
    return this.editor.getReadOnly();
  }

  set readOnly(value) {
    this.editor.setReadOnly(value);
  }

  /**
   * Get the index of the actual line we're on.
   * By "actual line", we mean lines that are line-break separated, not ones
   * that are joined together in the output.
   */
  getActualLineIndex() {
    const { row } = this.editor.getCursorPosition();
    const linesAboveOrAtCursor = this.getContents().split("\n").slice(0, row + 1);
    return linesAboveOrAtCursor.join('\n').split('\n\n').length - 1;
  }
}
