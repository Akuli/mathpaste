/**
 * Manages "radio classes", i.e. classes which only one element at a time
 * should have.
 */
export class RadioClassManager {
  private currentElement: HTMLElement | null = null;

  constructor(public className: string) {}

  addClass(element: HTMLElement) {
    this.removeClass();
    element.classList.add(this.className);
    this.currentElement = element;
  }

  toggleClass(element: HTMLElement) {
    const shouldAddClass = this.currentElement !== element;
    this.removeClass();
    if (shouldAddClass) this.addClass(element);
  }

  removeClass() {
    if (this.currentElement === null) return;

    this.currentElement.classList.remove(this.className);
    this.currentElement = null;
  }
}

// there are two properties that give correct values, one is
// "experimental" and the other is "non-standard", so i chose the
// experimental property
// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/offsetX
// https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/layerX
export const xyFromEvent = (event: MouseEvent): [number, number] => [event.offsetX, event.offsetY];
