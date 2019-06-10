import Renderer from "../js/renderer";

(global as any).MathJax = { Hub: { Queue: jest.fn() } };

describe("Renderer", () => {
  it("should render math by default", async () => {
    const lineContainer = document.createElement("div");
    lineContainer.id = "lineContainer";
    document.body.append(lineContainer);
    const renderer = new Renderer(lineContainer.id);
    const math = "alpha + beta";
    await renderer.render(math);
    expect(lineContainer.innerHTML).toBe(`<div class="line">\`${math}\`</div>`);
    expect(MathJax.Hub.Queue).toHaveBeenCalledWith(["Typeset", MathJax.Hub, lineContainer.firstChild]);
  });
});
