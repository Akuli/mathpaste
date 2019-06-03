/* jshint browser: true, module: true, esversion: 8 */
/* globals MathJax */

import LZString from "lz-string";

import * as firebase from "./firebase";
import * as storageManager from "./storage";

async function getPasteFromHash(hash) {
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
    const mathId = hash.substr("#saved:".length);
    return (await firebase.get(mathId));
  }

  return null;
}

export async function loadPaste() {
  const hashPaste = await getPasteFromHash(window.location.hash);
  if (hashPaste) return hashPaste;

  const math = storageManager.getMath();
  const imageString = storageManager.getImageString();
  return { math, imageString };
}

export async function uploadPaste(math, imageString) {
  return (await firebase.post(math, imageString));
}
