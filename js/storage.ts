export function getMath(): string | null {
  return localStorage.getItem("mathpaste-math");
}

export function setMath(newMath: string) {
  localStorage.setItem("mathpaste-math", newMath);
}

export function getImageString(): string | null {
  return localStorage.getItem("mathpaste-image-string");
}

export function setImageString(newImageString: string) {
  localStorage.setItem("mathpaste-image-string", newImageString);
}
