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

(function() {
    // 'await post("asd", imageString)' puts math to firebase and returns an ID string
    async function post(math, imageString) {
        // ref represents the object that represents the math in firebase
        const ref = await firebase.database().ref("maths").push();
        ref.set({ content: math, timestamp: (new Date()).valueOf(), image: imageString });
        return ref.key;
    }

    // 'await get(an ID from post)' returns { math: string, imageString: string }
    // TODO: handle errors
    async function get(pasteId) {
        const value = (await firebase.database().ref(`maths/${pasteId}`).once("value")).val();
        // value.image may be missing because backwards compat with older mathpastes
        return { math: value.content, imageString: value.image || "" };
    }

    // for require.js
    define({
        post: post,
        get: get
    });
}());
