import { TEXT_PREFIX } from "../js/consts";
import Renderer from "../js/renderer";


describe("Renderer", () => {
  let lineContainerNum = 0;

  function createLineContainerAndRenderer(callback: () => [string, number]) {
    const lineContainer = document.createElement("div");
    lineContainer.id = "lineContainer" + lineContainerNum++;
    document.body.append(lineContainer);

    const renderer = new Renderer(lineContainer.id, callback!);
    renderer.highlightLine = jest.fn((lineNumber: number) => {
      expect(lineNumber).toEqual(0);
    });

    return [lineContainer, renderer] as [HTMLDivElement, Renderer];
  }

  const renderCallbacks = new Map() as Map<string, () => void>;
  const delayedCallbacks = new Set();
  const MathjaxHubQueue = jest.fn(([cmd, hub, element, callback]: [string, MathJax.Hub, Element, () => void]) => {
    expect(cmd).toEqual("Typeset");
    expect(hub).toBe(MathJax.Hub);
    expect(element.parentElement).not.toBeNull();
    renderCallbacks.set(element.parentElement!.id, callback);
    if (!delayedCallbacks.has(element.parentElement!.id)) callback();
  });

  (global as any).MathJax = { Hub: { Queue: MathjaxHubQueue } };

  it("renders as math by default", async () => {
    const [lineContainer, renderer] = createLineContainerAndRenderer(() => ["alpha + beta", 0]);
    await renderer.render();
    expect(lineContainer.innerHTML).toEqual('<div class="line">`alpha + beta`</div>');
    expect(renderer.highlightLine).toHaveBeenCalledTimes(1);
    expect(MathJax.Hub.Queue).toHaveBeenCalledTimes(1);
  });

  it("renders as markdown when prefixed with TEXT_PREFIX", async () => {
    const [lineContainer, renderer] = createLineContainerAndRenderer(() => [TEXT_PREFIX + "how **bold** of you", 0]);
    await renderer.render();
    expect(lineContainer.innerHTML).toEqual('<div class="line"><p>how <strong>bold</strong> of you</p>\n</div>');
    expect(renderer.highlightLine).toHaveBeenCalledTimes(1);
  });

  it("resolves only after math has been typeset", async () => {
    const [lineContainer, renderer] = createLineContainerAndRenderer(() => ["", 0]);
    delayedCallbacks.add(lineContainer.id);

    let timePassed = false;
    const promise = renderer.render();

    setTimeout(() => {
      timePassed = true;
      const callback = renderCallbacks.get(lineContainer.id);
      expect(callback).not.toBeUndefined();
      callback!();
    }, 10);

    await promise;
    expect(timePassed).toBeTruthy();
  });

  it("keeps state consistent even after concurrent calls", async () => {
    let toRender = "";
    const [lineContainer, renderer] = createLineContainerAndRenderer(() => [toRender, 0]);

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
      promiseArray.push(renderer.render());
    }
    toRender = "";
    promiseArray.push(renderer.render());

    await Promise.all(promiseArray);
    expect(lineContainer.innerHTML).toBe('<div class="line">``</div>');
  });
});
