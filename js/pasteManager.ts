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

        // new maths must have a number timestamp
        // rest doesn't matter, will just cause errors when someone tries to view the math
        ".validate": "newData.hasChildren(['timestamp']) && newData.child('timestamp').isNumber()",

        // the docs don't seem to mention this, but nothing works without this
        // it still validates before writing
        ".write": true
      }
    }
  }
}

there used to be more ".validate" rules, but those got outdated easily when developing mathpaste

TODO: delete old maths regularly?

encryption works so that the decryption key is NEVER sent to the database
so as the database user, i can't read people's mathpastes
the decryption key goes only to the paste URL, giving access only to people who have the URL
*/
/* tslint:enable */

import * as LZString from "lz-string";
import * as firebase from "firebase/app";
import SimpleCrypto from "simple-crypto-js";

type Paste = {
  math: string | null;
  imageString: string | null;
};

export default class PasteManager {
  private maybeFirebaseApp: firebase.app.App | null = null;

  private async getFirebaseApp(): Promise<firebase.app.App> {
    if (this.maybeFirebaseApp === null) {
      await import(/* webpackPrefetch: true */ "firebase/database");

      this.maybeFirebaseApp = firebase.initializeApp({
        apiKey: "AIzaSyD3O2tMBXqz8Go4-xCz9P-HXBH7WNrX9N4",
        authDomain: "mathpaste-8cc8e.firebaseapp.com",
        databaseURL: "https://mathpaste-8cc8e.firebaseio.com",
        projectId: "mathpaste-8cc8e",
        storageBucket: "",
        messagingSenderId: "204735746640",
      });
    }

    return this.maybeFirebaseApp;
  }

  async loadPaste(): Promise<Paste> {
    const hashPaste = await this.getPasteFromHash(window.location.hash);
    if (hashPaste) return hashPaste;

    const math = localStorage.getItem("mathpaste-math");
    const imageString = localStorage.getItem("mathpaste-image-string");
    return { math, imageString };
  }

  private async getPasteFromHash(hash: string): Promise<Paste | null> {
    if (hash.startsWith("#fullmath:")) {
      // this is for backwards compat
      // in older versions of mathpaste, all of the math was compressed in the url
      // in this version of mathpaste, loading those urls is still supported
      const encodedMath = hash.substr("#fullmath:".length);
      return {
        math: LZString.decompressFromEncodedURIComponent(encodedMath),
        imageString: "",
      };
    }

    if (hash.startsWith("#saved:")) {
      const afterFirstColon = hash.substr("#saved:".length);
      let pasteId: string, decryptionKey: string | undefined;

      if (afterFirstColon.includes(":")) {
        [ pasteId, decryptionKey ] = afterFirstColon.split(":");
      } else {
        // backwards compatibility: old pastes are not encrypted
        pasteId = afterFirstColon;
        decryptionKey = undefined;
      }

      return await this.getPasteFromFirebase(pasteId, decryptionKey);
    }

    return null;
  }

  private async getPasteFromFirebase(pasteId: string, decryptionKey?: string): Promise<Paste> {
    // pasteId is string formatted here, but there's no need to avoid injection attacks.
    // The database access has very restricted permissions.
    // If I added a pasteId validation here, any mathpaste user could easily get around it,
    // because this is client-side code.
    const fb = await this.getFirebaseApp();
    let value = (await fb
      .database()
      .ref(`maths/${pasteId}`)
      .once("value")
    ).val();

    // new mathpastes encrypt the stuff
    if (value.encryptedValue !== undefined) {
      if (decryptionKey === undefined) {
        throw new Error("missing decryption key");
      }

      // true means that we're decrypting an object
      value = new SimpleCrypto(decryptionKey!).decrypt(value.encryptedValue, true);
    }

    // value.image may be missing or empty because backwards compat with older mathpastes
    // but the empty string is not valid LZString utf16 compressed stuff
    return {
      math: value.content,
      imageString: value.image ? LZString.decompressFromUTF16(value.image) : "",
    };
  }

  // returns a usable window.location.hash value
  async uploadPaste(math: string, imageString: string): Promise<string> {
    const decryptionKey = SimpleCrypto.generateRandom() as string;
    const encryptedValue = new SimpleCrypto(decryptionKey).encrypt({
      content: math,
      image: LZString.compressToUTF16(imageString),
    });

    // ref represents the object that represents the math in firebase
    const fb = await this.getFirebaseApp();
    const ref = await fb
      .database()
      .ref("maths")
      .push();
    ref.set({
      encryptedValue: encryptedValue,
      timestamp: new Date().valueOf(),
    });

    return "#saved:" + ref.key! + ":" + decryptionKey;
  }

  saveMath(math: string) {
    localStorage.setItem("mathpaste-math", math);
  }

  saveImageString(imageString: string) {
    localStorage.setItem("mathpaste-image-string", imageString);
  }
}
