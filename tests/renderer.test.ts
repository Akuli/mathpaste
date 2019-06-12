import { TEXT_PREFIX } from "../js/consts";
import Renderer from "../js/renderer";

describe("Renderer", () => {
  const createLineContainer = () => {
    const lineContainer = document.createElement("div");
    lineContainer.id = "lineContainer" + new Date().valueOf() + Math.floor(Math.random() * 10);
    document.body.append(lineContainer);
    return lineContainer;
  };

  const renderCallbacks = new Map() as Map<string, () => void>;
  const delayedCallbacks = new Set();
  const MathjaxHubQueue = jest.fn(([cmd, hub, element, callback]: [string, MathJax.Hub, Element, () => void]) => {
    expect(cmd).toBe("Typeset");
    expect(hub).toBe(MathJax.Hub);
    expect(element.parentElement).not.toBeNull();
    renderCallbacks.set(element.parentElement!.id, callback);
    if (!delayedCallbacks.has(element.parentElement!.id)) callback();
  });

  (global as any).MathJax = { Hub: { Queue: MathjaxHubQueue } };

  describe("#render()", () => {
    it("renders math by default", async () => {
      const lineContainer = createLineContainer();
      const renderer = new Renderer(lineContainer.id);
      const math = "alpha + beta";
      await renderer.render(math);
      expect(lineContainer.innerHTML).toBe(`<div class="line">\`${math}\`</div>`);
      expect(MathJax.Hub.Queue).toHaveBeenCalledTimes(1);
    });

    it("renders markdown when prefixed with TEXT_PREFIX", async () => {
      const lineContainer = createLineContainer();
      const renderer = new Renderer(lineContainer.id);
      await renderer.render(TEXT_PREFIX + "how **bold** of you");
      expect(lineContainer.innerHTML).toBe(`<div class="line"><p>how <strong>bold</strong> of you</p>\n</div>`);
    });

    it("resolves only after math has been typeset", async () => {
      const lineContainer = createLineContainer();
      const renderer = new Renderer(lineContainer.id);
      delayedCallbacks.add(lineContainer.id);

      let timePassed = false;
      const promise = renderer.render("");

      setTimeout(() => {
        timePassed = true;
        const callback = renderCallbacks.get(lineContainer.id);
        expect(callback).not.toBeUndefined();
        callback!();
      }, 10);

      await promise;
      expect(timePassed).toBeTruthy();
    });

    it("keeps state consistent even after concurrent render calls", async () => {
      const lineContainer = createLineContainer();
      const renderer = new Renderer(lineContainer.id);

      let toRender = "";
      const actions = [
        () => {
          toRender = "";
        },
        () => {
          toRender += Array(10)
            .fill("a^2 + b^2 = c^2")
            .join("\n\n");
        },
      ];

      const promiseArray = [];
      for (let i = 0; i < 10; i++) {
        const act = actions[i % actions.length];
        act();
        promiseArray.push(renderer.render(toRender));
      }
      promiseArray.push(renderer.render(""));

      const results = await Promise.all(promiseArray);
      expect(lineContainer.innerHTML).toBe('<div class="line">``</div>');
      expect(results).toEqual(
        new Array(promiseArray.length).fill(undefined).map((_, idx) => idx === promiseArray.length - 1),
      );
    });
  });
});
