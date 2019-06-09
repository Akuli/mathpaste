import * as ace from "brace";
import "brace/theme/tomorrow_night_eighties";
import { EventEmitter } from "events";

import "./modes/asciimath";

export default class Editor extends EventEmitter {
  private editor: ace.Editor;

  constructor(editorId: string) {
    super();

    this.editor = ace.edit(editorId);
    this.editor.setOption("selectionStyle", "text");
    this.editor.setOption("showLineNumbers", false);
    this.editor.setOption("showGutter", false);
    this.editor.setOption("wrap", true);
    this.editor.setTheme("ace/theme/tomorrow_night_eighties");
    this.editor.getSession().setMode("ace/mode/asciimath");
    this.registerEventHandlers();

    // undoing is done differently, it should undo either in the math only or
    // in the editor only
    if (!(delete (this.editor.getKeyboardHandler() as any).commandKeyBinding['ctrl-z'])) {
      throw new Error("cannot remove (br)ace's default ctrl+z handler");
    }
  }

  undo() {
    this.editor.undo();
  }

  private registerEventHandlers() {
    const session = this.editor.getSession();

    session.on("change", () => this.emit("change", this.contents, true));

    session.selection.on(
      "changeCursor",
      () => this.emit("cursorMoved", this.editor.getCursorPosition(), this.contents),
    );
  }

  get contents() {
    return this.editor.getValue();
  }

  set contents(value: string) {
    this.editor.getSession().setValue(value);
    this.emit("change", this.contents, false);
  }

  setMode(modeName: string) {
    this.editor.getSession().setMode(modeName);
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
    const linesAboveOrAtCursor = this.contents.split("\n").slice(0, row + 1);
    return linesAboveOrAtCursor.join("\n").split("\n\n").length - 1;
  }
}
