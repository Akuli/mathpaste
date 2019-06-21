import { debounce } from "../js/utils";

describe("debounce", () => {
  const sleep = (interval: number) => new Promise(resolve => setTimeout(resolve, interval));

  describe("#debounce()", () => {
    it("only calls a function once if called many times", async () => {
      const fn = jest.fn();
      const debouncedFn = debounce(10, fn);

      const debounced = [];
      for (let i = 0; i < 100; ++i) {
        debounced.push(debouncedFn());
      }
      await Promise.all(debounced);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("calls a function many times if enough time passes", async () => {
      const fn = jest.fn();
      const debouncedFn = debounce(10, fn);

      let counter = 0;

      await new Promise(resolve => {
        setTimeout(async function helper() {
          await debouncedFn();

          if (++counter < 20) {
            setTimeout(helper, debouncedFn.interval);
          } else {
            resolve();
          }
        }, debouncedFn.interval);
      });

      expect(fn).toHaveBeenCalledTimes(20);
    });

    it("resolves even if the function is not called", async () => {
      const fn = jest.fn();
      const debouncedFn = debounce(10, fn);

      const notCalled = debouncedFn();
      const called = debouncedFn();

      expect(await Promise.all([notCalled, called])).toEqual([false, true]);
    });

    it("awaits promises given to it", async () => {
      let awaited = false;
      const debouncedFn = debounce(10, async () => {
        await sleep(100);
        awaited = true;
      });

      await debouncedFn();
      expect(awaited).toBeTruthy();
    });

    it("rejects when exceptions are thrown", async () => {
      const up = new Error("yeet");
      const debouncedFn = debounce(0, () => {
        throw up;
      });

      await expect(debouncedFn()).rejects.toThrow(up);
    });
  });
});
