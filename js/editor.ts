import * as ace from "ace-builds";
import "ace-builds/src-min-noconflict/theme-tomorrow_night_eighties";

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

  /**
   * Add a filter for a certain event that allows you to prevent ace's default behavior
   */
  addKeyFilter(filter: (event: KeyboardEvent) => boolean) {
    /* the type definitions for this function are just blatantly wrong, so we'll ignore them */
    (this.editor.keyBinding.addKeyboardHandler as any)((
      _data: unknown,
      _hashId: unknown,
      _keyString: unknown,
      _keyCode: unknown,
      event: KeyboardEvent | undefined
    ) =>
      /*
       * the way ace's keyboard handlers work is that if they return a falsy
       * value, they're "ignored", and if they return an object with the
       * command key set to the string "null", the key is "eaten"
       */
      event && filter(event) ? { command: "null" } : false
    );
  }

  undo() {
    this.editor.undo();
  }

  private registerEventHandlers() {
    const session = this.editor.getSession();

    this.editor.on("change", () => {
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

  get keyboardHandler() {
    return this.editor.getKeyboardHandler();
  }

  set keyboardHandler(value: string) {
    this.editor.setKeyboardHandler(value);
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
