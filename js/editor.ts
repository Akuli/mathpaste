import * as ace from "ace-builds";
import "ace-builds/webpack-resolver";

import { StrictEventEmitter } from "./utils";

import "./modes/asciimath";

export enum ChangeType {
  UserInput,
  SetContents,
}

interface EditorEvents {
  change: (contents: string, changeType: ChangeType) => void;
  cursorMoved: (position: ace.Ace.Point, contents: string) => void;
}

export class Editor extends StrictEventEmitter<EditorEvents>() {
  private editor: ace.Ace.Editor;
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

    session.on("change" as any, () => {
      this.emit("change", this.contents, this.isSettingContents ? ChangeType.SetContents : ChangeType.UserInput);
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
  }

  get mode() {
    return (this.editor.getSession().getMode() as any).$id;
  }

  set mode(value: string) {
    this.editor.getSession().setMode(value);
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
