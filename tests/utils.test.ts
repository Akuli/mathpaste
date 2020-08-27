import { RunOnceAtATime } from "../js/utils";

describe("RunOnceAtATime", () => {
  it("calls a slow function twice if ran many times concurrently", async () => {
    const sleep = (interval: number) => new Promise(resolve => setTimeout(resolve, interval)) as Promise<void>;
    const fn = jest.fn();
    const runner = new RunOnceAtATime(async () => {
      await sleep(20);
      fn();
    });

    const promises = [];
    for (let i = 0; i < 100; ++i) {
      promises.push(runner.run());
    }
    await Promise.all(promises);

    // first call: let's get started
    // second call: i've been asked to run while i was doing 1st call, let's run again now
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("calls a function many times if not ran while already running", async () => {
    const fn = jest.fn();
    const runner = new RunOnceAtATime(async () => fn());

    await runner.run();
    await runner.run();
    await runner.run();
    await runner.run();
    await runner.run();
    expect(fn).toHaveBeenCalledTimes(5);
  });

  it("doesn't stop working when an exception is thrown", async () => {
    let counter = 0;
    const up = new Error("yeet");
    const runner = new RunOnceAtATime(async () => {
      counter++;
      if (counter === 1) {
        throw up;
      }
    });

    expect(counter).toEqual(0);

    // couldn't get this to work with jest's .toThrow
    let caught = false;
    try {
      await runner.run();
    } catch (e) {
      expect(e).toBe(up);
      caught = true;
    }
    expect(caught).toBe(true);
    expect(counter).toEqual(1);

    await runner.run();
    expect(counter).toEqual(2);
  });
});
