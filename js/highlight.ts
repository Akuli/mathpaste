import { Editor } from "./editor";

import { getScrollbarWidth } from "./utils";

export type Rules = Array<{ cls: string; regex: RegExp }>;

export default (editor: Editor, rules: Rules) => {
  const overlay = document.getElementById("editor-highlight")!;

  const createOverlay = () => {
    const rect = editor.element.getBoundingClientRect();

    overlay.style.width = (rect.width - getScrollbarWidth()).toString();
    overlay.style.height = rect.height.toString();
  };

  // we should be safe from XSS cause we split up stuff like `<script>`
  const updateOverlay = () =>
    (overlay.innerHTML = editor.contents
      .replace(rulesRegex, (match, ...args) => {
        // we skip the last two arguments because they are the offset and the whole string.
        const groups = args.slice(0, -2) as Array<string | undefined>;
        const groupIndex = groups.findIndex(g => g !== undefined);
        const cls = rulesClasses[groupIndex];
        return `<span class="${cls}">${match}</span>`;
      })
      .replace(/\n/g, "<br>"));

  const rulesRegex = new RegExp(rules.map(({ regex }) => `(${regex.toString().slice(1, -1)})`).join("|"), "g");
  const rulesClasses = rules.map(({ cls }) => cls);

  createOverlay();
  updateOverlay();

  editor.on("change", updateOverlay);
  window.addEventListener("resize", createOverlay);
  editor.element.addEventListener("scroll", () => (overlay.scrollTop = editor.element.scrollTop));
};
