import { EventEmitter } from "events";
import ImportedStrictEventEmitter from "strict-event-emitter-types";

// https://github.com/bterlson/strict-event-emitter-types/issues/3
export function StrictEventEmitter<Events>() {
  return EventEmitter as (new () => ImportedStrictEventEmitter<EventEmitter, Events>);
}

interface RadioClassManagerEvents {
  change: () => void;
}

/**
 * Manages "radio classes", i.e. classes which only one element at a time
 * should have.
 */
export class RadioClassManager extends StrictEventEmitter<RadioClassManagerEvents>() {
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

export const debounce = (interval: number, func: (...args: any[]) => any) => {
  // the reason we use `any` is because different platforms use different
  // values for `{set,clear}Timeout` and TypeScript gets confused.
  let timeoutHandle: any | null = null;
  let promiseResolve: ((value: boolean) => void) | null = null;

  const closure = (...args: any[]) => {
    return new Promise((resolve, reject) => {
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
        if (promiseResolve !== null) promiseResolve(false);
      }

      timeoutHandle = setTimeout(async () => {
        try {
          // This is fine even if `func` does not return a promise because
          // `await` with a non-promise is basically a noop.
          await func(...args);
          resolve(true);
        } catch (e) {
          reject(e);
        } finally {
          timeoutHandle = null;
          promiseResolve = null;
        }
      }, interval);

      promiseResolve = resolve;
    });
  };
  closure.interval = interval;
  return closure;
};

export const offsetToPosition = (text: string, offset: number) =>
  Array.from(text.substr(0, offset)).reduce(
    ({ row, column }, c) => (c === "\n" ? { row: row + 1, column: 0 } : { row, column: column + 1 }),
    { row: 0, column: 0 },
  );

// https://stackoverflow.com/a/13382873
export const getScrollbarWidth = (): number => {
  // Creating invisible container
  const outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.overflow = "scroll"; // forcing scrollbar to appear
  outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps
  document.body.appendChild(outer);

  // Creating inner element and placing it in the container
  const inner = document.createElement("div");
  outer.appendChild(inner);

  // Calculating difference between container's full width and the child width
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

  // Removing temporary elements from the DOM
  outer.parentNode!.removeChild(outer);

  return scrollbarWidth;
};
