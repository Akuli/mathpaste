import * as ace from "brace";

export type HighlightStateTransition = {
  token: string;
  regex: RegExp | string;
  next?: string;
};
export type HighlightState = HighlightStateTransition[];
export type HighlightRules = Record<string, HighlightState>;

export type Embed = {
  moduleName: string;
  highlightClassName: string;
  extraState: HighlightState;
};

export function defineMode(name: string, highlightRules: HighlightRules, embeds: Embed[] = []) {
  const define = (ace as any).define;

  const baseDependencies = ["require", "exports", "ace/mode/text", "ace/mode/text_highlight_rules"];
  const highlightRulesModule = `ace/mode/${name}_highlight_rules`;

  define(`ace/mode/${name}`, [...baseDependencies, highlightRulesModule], (acequire: any, exports: any) => {
    const TextMode = acequire("ace/mode/text").Mode;
    const ModeHighlightRules = acequire(`ace/mode/${name}_highlight_rules`).HighlightRules;

    exports.Mode = class extends TextMode {
      HighlightRules: typeof ModeHighlightRules = ModeHighlightRules;
    };
  });

  const embedDependencies = embeds.map(embed => `ace/mode/${embed.moduleName}_highlight_rules`);

  define(highlightRulesModule, [...baseDependencies, ...embedDependencies], (acequire: any, exports: any): void => {
    const TextHighlightRules = acequire("ace/mode/text_highlight_rules").TextHighlightRules;

    exports.HighlightRules = class extends TextHighlightRules {
      $rules: HighlightRules = highlightRules;

      constructor() {
        super();

        embeds.forEach(embed =>
          this.embedRules(
            acequire(`ace/mode/${embed.moduleName}_highlight_rules`)[embed.highlightClassName],
            `${embed.moduleName}-`,
            embed.extraState,
          ),
        );
      }
    };
  });
}
