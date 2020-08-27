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

export class Debouncer {
  private timeoutHandle: any | null = null;
  private promiseResolve: ((value: boolean) => void) | null = null;

  constructor(public interval: number) {}

  debounce(func: () => unknown): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.timeoutHandle !== null) {
        clearTimeout(this.timeoutHandle);
        if (this.promiseResolve !== null) this.promiseResolve(false);
      }

      this.timeoutHandle = setTimeout(async () => {
        try {
          // This is fine even if `func` does not return a promise because
          // `await` with a non-promise is basically a noop.
          await func();
          resolve(true);
        } catch (e) {
          reject(e);
        } finally {
          this.timeoutHandle = null;
          this.promiseResolve = null;
        }
      }, this.interval);

      this.promiseResolve = resolve;
    });
  }
}
