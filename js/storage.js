define([], function() {
  "use strict";

  // everything wrapped in try,except because nothing goes badly wrong
  function set(math, imageString) {
    try {
      window.localStorage.setItem('mathpaste-math', math);
      window.localStorage.setItem('mathpaste-image-string', imageString);
    } catch(e) {
      console.log(e);
    }
  }

  function get() {
    try {
      const result = {
        math: window.localStorage.getItem('mathpaste-math'),
        imageString: window.localStorage.getItem('mathpaste-image-string'),
      };
      if (result.math === null || result.imageString === null) {
        return null;
      }
      return result;
    } catch(e) {
      console.log(e);
      return null;
    }
  }

  return { set: set, get: get };
});
