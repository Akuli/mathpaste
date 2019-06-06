/* tslint:disable */
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
/* tslint:enable */

import * as LZString from "lz-string";

import * as storageManager from "./storage";

import * as firebase from "firebase/app";

interface IPaste {
    math: string | null;
    imageString: string | null;
}

export default class PasteManager {
  private maybeFirebaseApp: firebase.app.App | null = null;

  public async loadPaste(): Promise<IPaste> {
    const hashPaste = await this.getPasteFromHash(window.location.hash);
    if (hashPaste) return hashPaste;

    const math = storageManager.getMath();
    const imageString = storageManager.getImageString();
    return { math, imageString };
  }

  public async uploadPaste(math: string, imageString: string) {
    // ref represents the object that represents the math in firebase
    const fb = await this.getFirebaseApp();
    const ref = await fb.database().ref("maths").push();
    ref.set({
      content: math,
      image: LZString.compressToUTF16(imageString),
      timestamp: (new Date()).valueOf(),
    });
    return ref.key;
  }

  private async getFirebaseApp(): Promise<firebase.app.App> {
    if (this.maybeFirebaseApp === null) {
      await import(/* webpackChunkName: "firebaseDatabase" */ "firebase/database");

      this.maybeFirebaseApp = firebase.initializeApp({
        apiKey: "AIzaSyD3O2tMBXqz8Go4-xCz9P-HXBH7WNrX9N4",
        authDomain: "mathpaste-8cc8e.firebaseapp.com",
        databaseURL: "https://mathpaste-8cc8e.firebaseio.com",
        messagingSenderId: "204735746640",
        projectId: "mathpaste-8cc8e",
        storageBucket: "",
      });
    }

    return this.maybeFirebaseApp;
  }

  private async getPasteFromHash(hash: string): Promise<IPaste | null> {
    if (hash.startsWith("#fullmath:")) {
      // this is for backwards compat
      // in older versions of mathpaste, all of the math was compressed in the url
      // in this version of mathpaste, loading those urls is still supported
      const encodedMath = hash.substr("#fullmath:".length);
      return {
        imageString: "",
        math: LZString.decompressFromEncodedURIComponent(encodedMath),
      };
    }

    if (hash.startsWith("#saved:")) {
      const pasteId = hash.substr("#saved:".length);
      return (await this.getPasteFromFirebase(pasteId));
    }

    return null;
  }

  private async getPasteFromFirebase(pasteId: string): Promise<IPaste> {
    const fb = await this.getFirebaseApp();
    const value = (await fb.database().ref(`maths/${pasteId}`).once("value")).val();

    // value.image may be missing or empty because backwards compat with older mathpastes
    // but the empty string is not valid LZString utf16 compressed stuff
    return {
      imageString: value.image ? LZString.decompressFromUTF16(value.image) : "",
      math: value.content,
    };
  }
}
