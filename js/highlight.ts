import { Editor } from "./editor";

import { getScrollbarWidth } from "./utils";

export type Rules = Array<{ cls: string; regex: RegExp }>;

const createHighlighter = (rules: Rules) => {
  const rulesRegex = new RegExp(rules.map(({ regex }) => `(${regex.toString().slice(1, -1)})`).join("|"), "g");
  const rulesClasses = rules.map(({ cls }) => cls);

  return (s: string) =>
    s.replace(rulesRegex, (match, ...args) => {
      // we skip the last two arguments because they are the offset and the whole string.
      const groups = args.slice(0, -2) as Array<string | undefined>;
      const groupIndex = groups.findIndex(g => g !== undefined);
      const cls = rulesClasses[groupIndex];
      return `<span class="${cls}">${match}</span>`;
    });
};

// It's important we walk the whole tree before returning (i.e. create an
// array, not a generator) because we can't mutate while iterating.
const walk = (root: Node, whatToShow: number) => {
  const walker = document.createTreeWalker(root, whatToShow);
  const result = [];
  let node;
  while ((node = walker.nextNode()) !== null) result.push(node);
  return result;
};

export default (editor: Editor, rules: Rules) => {
  const overlay = document.getElementById("editor-highlight")!;

  const highlighter = createHighlighter(rules);

  const updateOverlay = () => {
    const rect = editor.element.getBoundingClientRect();

    overlay.style.width = (rect.width - getScrollbarWidth()).toString();
    overlay.style.height = rect.height.toString();

    overlay.innerHTML = editor.element.innerHTML;

    walk(overlay, NodeFilter.SHOW_TEXT).forEach(node => {
      if (node.nodeValue === null) return;
      const el = document.createElement("span");
      el.innerHTML = highlighter(node.nodeValue);
      overlay.replaceChild(el, node);
    });
  };

  updateOverlay();
  editor.on("change", updateOverlay);
  window.addEventListener("resize", updateOverlay);
  editor.element.addEventListener("scroll", () => {
    overlay.scrollTop = editor.element.scrollTop;
    overlay.scrollLeft = editor.element.scrollLeft;
  });
};
