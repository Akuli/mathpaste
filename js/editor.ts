import * as ace from "brace";
import "brace/theme/tomorrow_night_eighties";
import { EventEmitter } from "events";

import "./modes/asciimath";

export default class Editor extends EventEmitter {
  private editor: ace.Editor;
  private isSettingContents: boolean = false;

  constructor(editorId: string, options: any) {
    super();

    this.editor = ace.edit(editorId);
    this.editor.setOptions(options);
    this.registerEventHandlers();
  }

  deleteKeybinding(binding: string) {
    delete (this.editor.getKeyboardHandler() as any).commandKeyBinding[binding];
  }

  undo() {
    this.editor.undo();
  }

  private registerEventHandlers() {
    const session = this.editor.getSession();

    session.on("change", () => {
      if (!this.isSettingContents) {
        this.emit("change", this.contents, /* created by user: */true);
      }
    });

    session.selection.on("changeCursor", () =>
      this.emit("cursorMoved", this.editor.getCursorPosition(), this.contents),
    );
  }

  get contents() {
    return this.editor.getValue();
  }

  set contents(value: string) {
    // this would trigger an registerEventHandlers() callback without
    // the isSettingContents attribute, which created funny bugs before
    // isSettingContents was added
    this.isSettingContents = true;
    try {
      this.editor.getSession().setValue(value);
    } finally {
      this.isSettingContents = false;
    }

      this.emit("change", this.contents, /* not created by user: */false);
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

  getRenderedLineIndex() {
    const { row } = this.editor.getCursorPosition();
    const linesAboveOrAtCursor = this.contents.split("\n").slice(0, row + 1);
    return linesAboveOrAtCursor.join("\n").split("\n\n").length - 1;
  }
}
