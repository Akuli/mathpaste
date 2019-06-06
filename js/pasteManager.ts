/*
select "Database" at left in Firebase, go to the "Rules" tab
these are the rules i use:

{
  "rules": {
    "maths": {
      "$math": {
        // only maths from the last 30 days can be read
        // exercise for you:  30 days = 2592000000 milliseconds
        ".read": "data.child('timestamp').val() > (now - 2592000000)",

        // new maths must have a string content and a number timestamp
        ".validate": "newData.hasChildren(['content', 'timestamp']) && newData.child('content').isString() && newData.child('timestamp').isNumber()",

        // the docs don't seem to mention this, but nothing works without this
        // it still validates before writing
        ".write": true
      }
    }
  }
}

TODO: validate image datas?
TODO: delete old maths regularly?
*/

import * as LZString  from "lz-string";

import * as storageManager from "./storage";

import * as firebase from "firebase/app";
import App = firebase.app.App;

type Paste = {
    math: string | null,
    imageString: string | null,
}

export default class PasteManager {
  private maybeFirebaseApp: App | null = null;

  private async getFirebaseApp(): Promise<App> {
    if (!this.maybeFirebaseApp) {
      await import(/* webpackChunkName: "firebaseDatabase" */ "firebase/database");

      this.maybeFirebaseApp = firebase.initializeApp({
        apiKey: "AIzaSyD3O2tMBXqz8Go4-xCz9P-HXBH7WNrX9N4",
        authDomain: "mathpaste-8cc8e.firebaseapp.com",
        databaseURL: "https://mathpaste-8cc8e.firebaseio.com",
        projectId: "mathpaste-8cc8e",
        storageBucket: "",
        messagingSenderId: "204735746640"
      });
    }

    return this.maybeFirebaseApp;
  }

  async loadPaste(): Promise<Paste> {
    const hashPaste = await this.getPasteFromHash(window.location.hash);
    if (hashPaste) return hashPaste;

    const math = storageManager.getMath();
    const imageString = storageManager.getImageString();
    return { math, imageString };
  }

  private async getPasteFromHash(hash: string): Promise<Paste> {
    if (hash.startsWith("#fullmath:")) {
      // this is for backwards compat
      // in older versions of mathpaste, all of the math was compressed in the url
      // in this version of mathpaste, loading those urls is still supported
      const encodedMath = hash.substr("#fullmath:".length);
      return {
        math: LZString.decompressFromEncodedURIComponent(encodedMath),
        imageString: ""
      };
    }

    if (hash.startsWith("#saved:")) {
      const pasteId = hash.substr("#saved:".length);
      return (await this.getPasteFromFirebase(pasteId));
    }

    return { math: null, imageString: null };
  }


  private async getPasteFromFirebase(pasteId: string): Promise<Paste> {
    const fb = await this.getFirebaseApp();
    const value = (await fb.database().ref(`maths/${pasteId}`).once("value")).val();

    // value.image may be missing or empty because backwards compat with older mathpastes
    // but the empty string is not valid LZString utf16 compressed stuff
    return {
      math: value.content,
      imageString: value.image ? LZString.decompressFromUTF16(value.image) : "",
    };
  }

  async uploadPaste(math: string, imageString: string) {
    // ref represents the object that represents the math in firebase
    const fb = await this.getFirebaseApp();
    const ref = await fb.database().ref("maths").push();
    ref.set({
      content: math,
      timestamp: (new Date()).valueOf(),
      image: LZString.compressToUTF16(imageString)
    });
    return ref.key;
  }
}
