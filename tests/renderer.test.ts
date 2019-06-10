import { TEXT_PREFIX } from "../js/consts";
import Renderer from "../js/renderer";

describe("Renderer", () => {
  const createLineContainer = () => {
    const lineContainer = document.createElement("div");
    lineContainer.id = "lineContainer" + new Date().valueOf();
    document.body.append(lineContainer);
    return lineContainer;
  };

  (global as any).MathJax = { Hub: { Queue: jest.fn() } };

  it("should render math by default", async () => {
    const lineContainer = createLineContainer();
    const renderer = new Renderer(lineContainer.id);
    const math = "alpha + beta";
    await renderer.render(math);
    expect(lineContainer.innerHTML).toBe(`<div class="line">\`${math}\`</div>`);
    expect(MathJax.Hub.Queue).toHaveBeenCalledWith(["Typeset", MathJax.Hub, lineContainer.firstChild]);
  });

  it("should render markdown when prefixed with TEXT_PREFIX", async () => {
    const lineContainer = createLineContainer();
    const renderer = new Renderer(lineContainer.id);
    await renderer.render(TEXT_PREFIX + "how **bold** of you");
    expect(lineContainer.innerHTML).toBe(`<div class="line"><p>how <strong>bold</strong> of you</p>\n</div>`);
  });
});
