/* jshint browser: true, module: true, esversion: 8 */

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

import LZString from "lz-string";
import * as firebase from "firebase/app";
import "firebase/database";

// 'await post("asd", imageString)' puts math to firebase and returns an ID string
export async function post(math, imageString) {
    // ref represents the object that represents the math in firebase
    const ref = await firebase.database().ref("maths").push();
    ref.set({
        content: math,
        timestamp: (new Date()).valueOf(),
        image: LZString.compressToUTF16(imageString)
    });
    return ref.key;
}

// 'await get(an ID from post)' returns { math: string, imageString: string }
// TODO: handle errors
export async function get(pasteId) {
    const value = (await firebase.database().ref(`maths/${pasteId}`).once("value")).val();

    // value.image may be missing or empty because backwards compat with older mathpastes
    // but the empty string is not valid LZString utf16 compressed stuff
    return {
      math: value.content,
      imageString: value.image ? LZString.decompressFromUTF16(value.image) : "",
    };
}
