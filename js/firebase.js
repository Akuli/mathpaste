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

define(["./lz-string.min.js"], function(LZString) {
    "use strict";

    // 'await post("asd", imageString)' puts math to firebase and returns an ID string
    async function post(math, imageString) {
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
    async function get(pasteId) {
        const value = (await firebase.database().ref(`maths/${pasteId}`).once("value")).val();
        const result = { math: value.content };

        // value.image may be missing or empty because backwards compat with older mathpastes
        // but the empty string is not valid LZString utf16 compressed stuff
        const compressedImageString = value.image || "";
        if (compressedImageString === "") {
            result.imageString = "";
        } else {
            result.imageString = LZString.decompressFromUTF16(compressedImageString);
        }

        return result;
    }

    return { post: post, get: get };
});
