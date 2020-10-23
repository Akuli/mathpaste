/*
select "Database" at left in Firebase, go to the "Rules" tab
these are the rules i use:

{
  "rules": {
    "maths-v2": {
      "$math": {
        ".read": "false",
        ".write": "!data.exists() || data.child('owner').val() == auth.uid",
        ".validate": "newData.hasChild('content') && newData.child('owner').val() == auth.uid",
        "content": {
          // 30 days = 2592000000ms, 2 days = 172800000ms
          // only maths from the last 30 days can be read
          ".read": "now < data.child('timestamp').val() + 2592000000",
          // timestamp has to be correct within 2 days (wrong time zones don't matter)
          ".validate": "newData.child('timestamp').isNumber() && now - 172800000 < newData.child('timestamp').val() && newData.child('timestamp').val() < now + 172800000",
        },
      }
    }
  }
}

documentation: https://firebase.google.com/docs/reference/security/database
there used to be more ".validate" rules, but those got outdated easily when developing mathpaste
decryption key is NEVER sent to the database so database access doesn't mean you can read people's pastes
a paste can be modified only by the anonymous user who created the paste (aka "owner" of paste)
to avoid pretending that you own a paste, it's not possible to read the owner
*/

import * as LZString from "lz-string";
import * as firebase from "firebase/app";
import "firebase/auth";
import SimpleCrypto from "simple-crypto-js";

type Paste = {
  math: string;
  imageString: string;
};

export default class PasteManager {
  private firebaseApp: firebase.app.App | null = null;  // access with getFirebaseApp()
  private lastIdAndCryptoKey: [string, string] | null = null;

  private async getFirebaseApp(): Promise<firebase.app.App> {
    // FIXME: can this call initializeApp twice?
    if (this.firebaseApp === null) {
      await import(/* webpackPrefetch: true */ "firebase/database");

      this.firebaseApp = firebase.initializeApp({
        apiKey: "AIzaSyD3O2tMBXqz8Go4-xCz9P-HXBH7WNrX9N4",
        authDomain: "mathpaste-8cc8e.firebaseapp.com",
        databaseURL: "https://mathpaste-8cc8e.firebaseio.com",
        projectId: "mathpaste-8cc8e",
        storageBucket: "",
        messagingSenderId: "204735746640",
      });
      await firebase.auth(this.firebaseApp).signInAnonymously();
    }

    return this.firebaseApp;
  }

  async loadPaste(): Promise<Paste> {
    const hashPaste = await this.getPasteFromHash(window.location.hash);
    if (hashPaste) return hashPaste;

    const math = localStorage.getItem("mathpaste-math") || "";
    const imageString = localStorage.getItem("mathpaste-image-string") || "";
    return { math, imageString };
  }

  private async getPasteFromHash(hash: string): Promise<Paste | null> {
    if (!hash.startsWith("#saved:")) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [hashtagSaved, pasteId, cryptoKey] = hash.split(":");
    return await this.getPasteFromFirebase(pasteId, cryptoKey);
  }

  private async getPasteFromFirebase(pasteId: string, cryptoKey: string): Promise<Paste> {
    // pasteId is string formatted here, but there's no need to avoid injection attacks.
    // The database access has very restricted permissions.
    // If I added a pasteId validation here, any mathpaste user could easily get around it,
    // because this is client-side code.
    const fb = await this.getFirebaseApp();
    const ref = fb.database().ref(`maths-v2/${pasteId}/content/encryptedValue`);
    const encryptedValue = (await ref.once("value")).val();
    const value = new SimpleCrypto(cryptoKey).decrypt(encryptedValue) as {
      content: string,
      image: string,
    };
    this.lastIdAndCryptoKey = [pasteId, cryptoKey];

    // value.image may be missing or empty because backwards compat with older mathpastes
    // but the empty string is not valid LZString utf16 compressed stuff
    return {
      math: value.content,
      imageString: value.image ? LZString.decompressFromUTF16(value.image)! : "",
    };
  }

  private createContent(paste: Paste, cryptoKey: string) {
    return {
      encryptedValue: new SimpleCrypto(cryptoKey).encrypt({
        content: paste.math,
        image: LZString.compressToUTF16(paste.imageString),
      }),
      timestamp: new Date().valueOf(),
    };
  }

  // returns a usable window.location.hash value
  async uploadPaste(paste: Paste): Promise<string> {
    const fb = await this.getFirebaseApp();
    let ref: firebase.database.Reference | null = null;
    let cryptoKey: string | null = null;

    if (this.lastIdAndCryptoKey !== null) {
      // try to modify old paste
      const [lastId, lastCryptoKey] = this.lastIdAndCryptoKey;
      const contentRef = await fb.database().ref(`maths-v2/${lastId}/content`);
      const content = this.createContent(paste, lastCryptoKey);
      try {
        await contentRef.set(content);
        ref = contentRef.parent;
        cryptoKey = lastCryptoKey;
      } catch (e) {
        // old paste was created by someone else, need to create new paste instead
        if (e.code !== "PERMISSION_DENIED") {
          throw e;
        }
      }
    }

    if (ref === null || cryptoKey === null) {
      cryptoKey = SimpleCrypto.generateRandom() as string;
      ref = await fb.database().ref("maths-v2").push();
      await ref.set({
        content: this.createContent(paste, cryptoKey),
        owner: firebase.auth(await this.getFirebaseApp()).currentUser!.uid,
      });
    }

    this.lastIdAndCryptoKey = [ref.key!, cryptoKey];
    return "#saved:" + this.lastIdAndCryptoKey.join(":");
  }

  saveMath(math: string) {
    localStorage.setItem("mathpaste-math", math);
  }

  saveImageString(imageString: string) {
    localStorage.setItem("mathpaste-image-string", imageString);
  }
}
