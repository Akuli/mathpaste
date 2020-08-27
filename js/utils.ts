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

// Ensures that two instances of func don't run at the same time.
// Similar to locks in thread programming.
export class RunOnceAtATime {
  public currentlyRunning: boolean = false;  // public only for tests
  private runAgain: boolean = false;

  constructor(private func: () => Promise<void>) {}

  async run() {
   if (this.currentlyRunning) {
      this.runAgain = true;
      return;
    }

    this.currentlyRunning = true;
    try {
      do {
        this.runAgain = false;
        await this.func();

        // let the browser do other things (and possibly set this.runAgain)
        // I tried the experimental requestIdleCallback instead of setTimeout, that worked too
        await new Promise(resolve => setTimeout(resolve, 10));
      } while (this.runAgain);
    } finally {
      this.currentlyRunning = false;
    }
  }
}
