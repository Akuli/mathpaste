/* jshint browser: true, esversion: 8, module: true */

export function get() {
  const result = {
      math: localStorage.getItem("mathpaste-math"),
      imageString: localStorage.getItem("mathpaste-image-string"),
  };

  if (result.math === null || result.imageString === null) {
    return null;
  }

  return result;
}

export function set(math, imageString) {
  localStorage.setItem("mathpaste-math", math);
  localStorage.setItem("mathpaste-image-string", imageString);
}
