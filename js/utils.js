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
    console.info(`Adding class ${this.className} to ${element}`);
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
      console.info(`Removing class ${this.className} from ${this._currentElement}`);
      this._currentElement.classList.remove(this.className);
      this._currentElement = null;
    }
  }
}
