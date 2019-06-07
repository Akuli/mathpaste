import "brace/mode/markdown";

import { defineMode } from "./defineMode";
import { LITERATE_PREFIX } from "../consts";

defineMode("literate_asciimath",
  {
    start: [
      {
        token: "comment.block",
        regex: "^" + LITERATE_PREFIX,
        next: "asciimath-start",
      },
      {
        token: "",
        regex: /(?=.)/,
        next: "markdown-start",
      },
    ]
  },
  [
    {
      moduleName: "asciimath",
      highlightClassName: "HighlightRules",
      extraState: [
        {
          token: "",
          regex: /^$/,
          next: "start",
        },
      ]
    },

    {
      moduleName: "markdown",
      highlightClassName: "MarkdownHighlightRules",
      extraState: [
        {
          token: "",
          regex: /^$/,
          next: "start",
        },
      ]
    },
  ]
);
