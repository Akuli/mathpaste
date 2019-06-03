/* jshint browser: true, module: true, esversion: 8 */
/* globals MathJax */

import ace from "brace";
import "brace/theme/tomorrow_night_eighties";
import EventEmitter from "events";

import "./asciimath_acemode";

export default class Editor extends EventEmitter {
  constructor() {
    super();

    this._editor = ace.edit("editor", {
      selectionStyle: "text",
      showLineNumbers: false,
      showGutter: false,
      wrap: true,
    });
    this._editor.setTheme("ace/theme/tomorrow_night_eighties");
    this._editor.getSession().setMode("ace/mode/asciimath"); // NOTE: The mode must be set here and not in `ace.edit` for some reason.
    this._editor.setAutoScrollEditorIntoView(true);
    this._registerEventHandlers();
  }

  _registerEventHandlers() {
    const session = this._editor.getSession();

    session.on("change", () => {
      this.emit("change", this.getContents(), true);
    });

    session.selection.on("changeCursor", () => {
      this.emit("cursorMoved", this._editor.getCursorPosition(), this.getContents());
    });

    // FIXME: handle ctrl-z in the draw area itself by using `stopPropagation`;
    delete this._editor.keyBinding.$defaultHandler.commandKeyBinding["ctrl-z"];
    document.addEventListener("keydown", event => {
      if (event.key === "z" && event.ctrlKey) {
        this._editor.undo();
      }
    });
  }

  getContents() {
    return this._editor.getValue();
  }

  async setContents(newContents) {
    this._editor.setReadOnly(true);
    this._editor.getSession().setValue(newContents || "");
    this.emit("change", this.getContents(), false);
    this._editor.setReadOnly(false);
  }

  /**
   * Get the index of the actual line we're on.
   * By "actual line", we mean lines that are line-break separated, not ones
   * that are joined together in the output.
   */
  getActualLineIndex() {
    const { row: cursorLine } = this._editor.getCursorPosition();
    const linesAboveOrAtCursor = this.getContents().split("\n").slice(0, cursorLine + 1);
    return linesAboveOrAtCursor.join('\n').split('\n\n').length - 1;
  }
}
