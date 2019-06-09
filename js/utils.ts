import { EventEmitter } from "events";

/**
 * Manages "radio classes", i.e. classes which only one element at a time
 * should have.
 */
export class RadioClassManager extends EventEmitter {
  private currentElement: HTMLElement | null = null;

  constructor(public className: string) {
    super();
  }

  addClass(element: HTMLElement) {
    this.removeClass();
    element.classList.add(this.className);
    this.currentElement = element;
    this.emit("change");
  }

  toggleClass(element: HTMLElement) {
    const shouldAddClass = !this.hasClass(element);
    this.removeClass();
    if (shouldAddClass) this.addClass(element);
  }

  removeClass() {
    if (this.currentElement === null) return;

    this.currentElement.classList.remove(this.className);
    this.currentElement = null;
    this.emit("change");
  }

  hasClass(element: HTMLElement): boolean {
    return this.currentElement === element;
  }
}

// there are two properties that give correct values, one is
// "experimental" and the other is "non-standard", so i chose the
// experimental property
// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/offsetX
// https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/layerX
export const xyFromEvent = (event: MouseEvent): [number, number] => [event.offsetX, event.offsetY];
