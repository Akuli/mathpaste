/**
 * Manages "radio classes", i.e. classes which only one element at a time
 * should have.
 */
export class RadioClassManager {
  constructor(className) {
    this.className = className;

    // XXX: 99% sure this should be a weakref
    this._currentElement = null;
  }

  addClass(element) {
    this.removeClass();
    element.classList.add(this.className);
    this._currentElement = element;
  }

  toggleClass(element) {
    const shouldAddClass = this._currentElement !== element;
    this.removeClass();
    if (shouldAddClass) this.addClass(element);
  }

  removeClass() {
    if (this._currentElement !== null) {
      this._currentElement.classList.remove(this.className);
      this._currentElement = null;
    }
  }
}

// there are two properties that give correct values, one is
// "experimental" and the other is "non-standard", so i chose the
// experimental property
// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/offsetX
// https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/layerX
export const xyFromEvent = event => [event.offsetX, event.offsetY];
