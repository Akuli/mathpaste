/* tslint:disable: max-line-length */

import * as ace from "brace";

// Ace uses a state machine for highlighting. The next three type definitions
// are a bit of arcane magic to make sure that we can only put states that
// actually exist in "next" and that we define every state we nominate.

type HighlightStateTransition<S extends "start" | string = "start"> = {
  token: string;
  regex: RegExp,
  next?: S,
};

type HighlightState<S extends "start" | string = "start"> = HighlightStateTransition<S>[];

type HighlightRules<KS extends "start" | string = "start"> = { [K in KS]: HighlightState<KS> }

type HighlightRulesFactory<KS extends "start" | string = "start"> = (opts: Record<any, any> | undefined) => HighlightRules<KS>;

const asciimathState: HighlightState = [
  {
    token: "keyword.operator",
    regex: /color\(.*?\)/,
  },
  {
    token: "variable.other",
    regex: /varepsilon|vartheta|epsilon|upsilon|lambda|Lambda|varphi|alpha|gamma|Gamma|delta|Delta|theta|Theta|kappa|sigma|Sigma|omega|Omega|beta|zeta|iota|eta|rho|tau|phi|Phi|chi|psi|Psi|mu|nu|xi|Xi|pi|Pi/,
  },
  {
    token: "keyword.operator",
    regex: /\\\\|backslashsetminus|twoheadrightarrowtail|twoheadrightarrow|frac\{2\}\{3\}|\/_\\|triangle|rightarrowtail|leftrightarrow|Leftrightarrow|\.\.\.\||rightarrow|Rightarrow|underbrace|root|therefore|ldots|cdots|downarrow|leftarrow|Leftarrow|underline|overbrace|\|\>\<\||bidwedge|emptyset|\|\\\ \||\|quad\||lceiling|rceiling|subseteq|supseteq|\>\-\>\>|overline|underset|partial|because|diamond|implies|uparrow|overset|\*\*\*|\|\>\<|ltimes|\>\<\||rtimes|bowtie|otimes|\^\^\^|bigvee|bigcap|bigcup|square|lfloor|rfloor|\-\<\=|preceq|\>\-\=|succeq|subset|supset|approx|propto|\<\=\>|forall|exists|\|\-\-|\|\=\=|models|langle|rangle|\>\-\>|\-\>\>|\|\-\>|mapsto|ubrace|obrace|cancel|arcsin|arccos|arctan|times|oplus|wedge|nabla|infty|aleph|vdots|ddots|angle|frown|notin|equiv|vdash|floor|color|cdot|\*\*|star|\/\/|\-\:|circ|odot|prod|\^\^|2\/3|2\^3|sqrt|oint|grad|\+\-|\:\.|\:\'|\|__|__\||\|\~|\~\||\!\=|\<\=|\>\=|\-\<|prec|\>\-|succ|\!in|sube|supe|\-\=|\~\=|cong|\~\~|prop|\=\>|_\|_|\(\:|\:\)|\<\<|\>\>|ceil|norm|uarr|darr|rarr|\-\>|larr|harr|rArr|lArr|hArr|ddot|sinh|cosh|tanh|sech|csch|coth|ast|div|o\+|o\.|sum|vee|vvv|cap|nnn|cup|uuu|int|del|O\/|\/_|sub|sup|and|not|neg|iff|bot|top|abs|hat|bar|vec|dot|sin|cos|tan|sec|csc|cot|exp|log|det|dim|mod|gcd|lcm|lub|glb|min|max|\+|\-|\*|xx|\@|ox|vv|nn|uu|pm|oo|CC|NN|QQ|RR|ZZ|\=|ne|\<|lt|\>|gt|le|ge|in|or|if|AA|EE|TT|\(|\)|\[|\]|\{|\}|to|ul|ln|f|g/,
  },
  {
    token: "comment.block",
    regex: /text\(.*?\)/,
  },
  {
    token: "comment.block",
    regex: /".*?"/,
  },
  {
    token: "variable.other",
    regex: /[a-zA-Z]/,
  },
  {
    token: "constant.numeric",
    regex: /[0-9]+(?:\.[0-9]+)?/,
  },
];

function defineMode<KS extends "start" | string>(name: string, highlightRules: HighlightRulesFactory<KS>) {
  (ace as any).define(
    `ace/mode/${name}`,
    ["require", "exports", "ace/mode/text", `ace/mode/${name}_highlight_rules`],
    (acequire: any, exports: any) => {
      const TextMode = acequire("ace/mode/text").Mode;
      const HighlightRules = acequire(`ace/mode/${name}_highlight_rules`).HighlightRules;

      exports.Mode = class extends TextMode {
        HighlightRules: typeof HighlightRules = HighlightRules;
      };
    },
  );

  (ace as any).define(
    `ace/mode/${name}_highlight_rules`,
    ["require", "exports", "ace/mode/text_highlight_rules"],
    (acequire: any, exports: any): void => {
      const TextHighlightRules = acequire("ace/mode/text_highlight_rules").TextHighlightRules;

      exports.HighlightRules = class extends TextHighlightRules {
        $rules: HighlightRules<KS>;

        constructor(opts: Record<any, any> | undefined) {
          super();

          this.$rules = highlightRules(opts);
        }
      };
    }
  );
}

defineMode("asciimath", () => ({ start: asciimathState }));
