// import { TEXT_PREFIX } from "../consts";
// import "./asciimath";

// defineMode(
//   "literate_asciimath",
//   {
//     start: [
//       {
//         token: "comment.block",
//         regex: "^" + TEXT_PREFIX,
//         next: "markdown-start",
//       },
//       {
//         token: "",
//         regex: /(?=.)/,
//         next: "asciimath-start",
//       },
//     ],
//   },
//   [
//     {
//       moduleName: "asciimath",
//       highlightClassName: "HighlightRules",
//       extraState: [
//         {
//           token: "",
//           regex: /^$/,
//           next: "start",
//         },
//       ],
//     },

//     {
//       moduleName: "markdown",
//       highlightClassName: "MarkdownHighlightRules",
//       extraState: [
//         {
//           token: "",
//           regex: /^$/,
//           next: "start",
//         },
//       ],
//     },
//   ],
// );
