/* jshint browser: true, esversion: 8, module: true */

export function getMath() {
  return localStorage.getItem("mathpaste-math");
}

export function setMath(newMath) {
  return localStorage.setItem("mathpaste-math", newMath);
}

export function getImageString() {
  return localStorage.getItem("mathpaste-image-string");
}

export function setImageString(newImageString) {
  return localStorage.setItem("mathpaste-image-string", newImageString);
}