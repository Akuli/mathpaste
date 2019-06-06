/* tslint:disable: max-line-length */

import * as ace from "brace";

type HighlightStateTransition = {
  token: string;
  regex: RegExp,
  next?: string,
};
type HighlightState = HighlightStateTransition[];
type HighlightRules = Record<string, HighlightState>;

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

const literateModeState: HighlightState = [
  {
    token: "comment.block",
    regex: /^> /,
    next: "asciimath-start",
  }
];

type Embed = {
  moduleName: string,
  highlightClassName: string,
  extraState: HighlightState,
};

function defineMode(name: string, highlightRules: HighlightRules, embeds: Embed[] = []) {
  const define = (ace as any).define;

  define(
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

  const highlightRulesDependencies = ["require", "exports", "ace/lib/oop", "ace/mode/text_highlight_rules"];

  embeds.forEach(embed => highlightRulesDependencies.push(`ace/mode/${embed.moduleName}_highlight_rules`));

  define(
    `ace/mode/${name}_highlight_rules`,
    highlightRulesDependencies,
    (acequire: any, exports: any): void => {
      const TextHighlightRules = acequire("ace/mode/text_highlight_rules").TextHighlightRules;

      exports.HighlightRules = class extends TextHighlightRules {
        $rules: HighlightRules = highlightRules;

        constructor() {
          super();

          embeds.forEach(embed => this.embedRules(
            acequire(`ace/mode/${embed.moduleName}_highlight_rules`)[embed.highlightClassName],
            `${embed.moduleName}-`,
            embed.extraState
          ));
        }
      };
    }
  );
}

defineMode("asciimath",
  {
    start: asciimathState,
  },
);

defineMode("literate_asciimath",
  {
    start: literateModeState,
  },
  [
    {
    moduleName: "asciimath",
    highlightClassName: "HighlightRules",
    extraState: [
      {
        token: "",
        regex: /$/,
        next: "start",
      },
    ]
    },
  ]
);
