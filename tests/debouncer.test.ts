import { Debouncer } from "../js/utils";

describe("Debouncer", () => {
  const sleep = (interval: number) => new Promise(resolve => setTimeout(resolve, interval));

  it("should only call a function once if called many times", async () => {
    const fn = jest.fn();
    const debouncer = new Debouncer(10);

    const debounced = [];
    for (let i = 0; i < 100; ++i) {
      debounced.push(debouncer.debounce(fn));
    }
    await Promise.all(debounced);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should call a function many times if time passes", async () => {
    const fn = jest.fn();
    const debouncer = new Debouncer(10);

    let counter = 0;

    await new Promise(resolve => {
      setTimeout(async function helper() {
        await debouncer.debounce(fn);

        if (++counter < 20) {
          setTimeout(helper, debouncer.interval);
        } else {
          resolve();
        }
      }, debouncer.interval);
    });

    expect(fn).toHaveBeenCalledTimes(20);
  });

  it("should resolve even if the function is not called", async () => {
    const fn = jest.fn();
    const debouncer = new Debouncer(10);

    const notCalled = debouncer.debounce(fn);
    const called = debouncer.debounce(fn);

    expect(await Promise.all([notCalled, called])).toEqual([false, true]);
  });

  it("should await promises given to it", async () => {
    let awaited = false;
    const debouncer = new Debouncer(0);

    await debouncer.debounce(async () => {
      await sleep(100);
      awaited = true;
    });
    expect(awaited).toBeTruthy();
  });
});
