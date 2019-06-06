/* tslint:disable: max-line-length max-classes-per-file */

import * as ace from "brace";

const define = (ace as any).define;

type Acequire = (arg0: string) => any;
type Exports = any;

define(
  "ace/mode/asciimath",
  ["require", "exports", "ace/mode/text", "ace/mode/asciimath_highlight_rules"],
  (acequire: Acequire, exports: Exports) => {
    const TextMode = acequire("ace/mode/text").Mode;
    const AsciiMathHighlightRules = acequire("ace/mode/asciimath_highlight_rules").AsciiMathHighlightRules;

    class Mode extends TextMode {
      public HighlightRules: typeof AsciiMathHighlightRules = AsciiMathHighlightRules;
    }

    exports.Mode = Mode;
  },
);

define(
  "ace/mode/asciimath_highlight_rules",
  ["require", "exports", "ace/mode/text"],
  (acequire: Acequire, exports: Exports): void => {
    const TextHighlightRules = acequire("ace/mode/text_highlight_rules").TextHighlightRules;

    class AsciiMathHighlightRules extends TextHighlightRules {
      public $rules: { [key: string]: Array<{ token: string, regex: RegExp }> } = {
        start: [
          {
            regex: /color\(.*?\)/,
            token: "keyword.operator",
          },
          {
            regex: /varepsilon|vartheta|epsilon|upsilon|lambda|Lambda|varphi|alpha|gamma|Gamma|delta|Delta|theta|Theta|kappa|sigma|Sigma|omega|Omega|beta|zeta|iota|eta|rho|tau|phi|Phi|chi|psi|Psi|mu|nu|xi|Xi|pi|Pi/,
            token: "variable.other",
          },
          {
            regex: /\\\\|backslashsetminus|twoheadrightarrowtail|twoheadrightarrow|frac\{2\}\{3\}|\/_\\|triangle|rightarrowtail|leftrightarrow|Leftrightarrow|\.\.\.\||rightarrow|Rightarrow|underbrace|root|therefore|ldots|cdots|downarrow|leftarrow|Leftarrow|underline|overbrace|\|\>\<\||bidwedge|emptyset|\|\\\ \||\|quad\||lceiling|rceiling|subseteq|supseteq|\>\-\>\>|overline|underset|partial|because|diamond|implies|uparrow|overset|\*\*\*|\|\>\<|ltimes|\>\<\||rtimes|bowtie|otimes|\^\^\^|bigvee|bigcap|bigcup|square|lfloor|rfloor|\-\<\=|preceq|\>\-\=|succeq|subset|supset|approx|propto|\<\=\>|forall|exists|\|\-\-|\|\=\=|models|langle|rangle|\>\-\>|\-\>\>|\|\-\>|mapsto|ubrace|obrace|cancel|arcsin|arccos|arctan|times|oplus|wedge|nabla|infty|aleph|vdots|ddots|angle|frown|notin|equiv|vdash|floor|color|cdot|\*\*|star|\/\/|\-\:|circ|odot|prod|\^\^|2\/3|2\^3|sqrt|oint|grad|\+\-|\:\.|\:\'|\|__|__\||\|\~|\~\||\!\=|\<\=|\>\=|\-\<|prec|\>\-|succ|\!in|sube|supe|\-\=|\~\=|cong|\~\~|prop|\=\>|_\|_|\(\:|\:\)|\<\<|\>\>|ceil|norm|uarr|darr|rarr|\-\>|larr|harr|rArr|lArr|hArr|ddot|sinh|cosh|tanh|sech|csch|coth|ast|div|o\+|o\.|sum|vee|vvv|cap|nnn|cup|uuu|int|del|O\/|\/_|sub|sup|and|not|neg|iff|bot|top|abs|hat|bar|vec|dot|sin|cos|tan|sec|csc|cot|exp|log|det|dim|mod|gcd|lcm|lub|glb|min|max|\+|\-|\*|xx|\@|ox|vv|nn|uu|pm|oo|CC|NN|QQ|RR|ZZ|\=|ne|\<|lt|\>|gt|le|ge|in|or|if|AA|EE|TT|\(|\)|\[|\]|\{|\}|to|ul|ln|f|g/,
            token: "keyword.operator",
          },
          {
            regex: /text\(.*?\)/,
            token: "comment.block",
          },
          {
            regex: /".*?"/,
            token: "comment.block",
          },
          {
            regex: /[a-zA-Z]/,
            token: "variable.other",
          },
          {
            regex: /[0-9]+(?:\.[0-9]+)?/,
            token: "constant.numeric",
          },
        ],
      };
    }

    exports.AsciiMathHighlightRules = AsciiMathHighlightRules;
  },
);
