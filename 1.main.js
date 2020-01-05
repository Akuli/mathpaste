(window.webpackJsonp=window.webpackJsonp||[]).push([[1],{164:function(e,t,s){"use strict";
/**
 * @license
 *
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 *
 * Copyright (c) 2018, Костя Третяк. (MIT Licensed)
 * https://github.com/KostyaTretyak/marked-ts
 */var n=this&&this.__assign||Object.assign||function(e){for(var t,s=1,n=arguments.length;s<n;s++)for(var i in t=arguments[s])Object.prototype.hasOwnProperty.call(t,i)&&(e[i]=t[i]);return e};Object.defineProperty(t,"__esModule",{value:!0});var i=s(170),r=s(169),o=s(168),l=s(165),h=function(){function e(){}return e.setOptions=function(e){return this.options=o.merge(this.options,e),this},e.setBlockRule=function(e,t){return void 0===t&&(t=function(){return""}),r.BlockLexer.simpleRules.push(e),this.simpleRenderers.push(t),this},e.parse=function(e,t){void 0===t&&(t=this.options);try{var s=this.callBlockLexer(e,t),n=s.tokens,i=s.links;return this.callParser(n,i,t)}catch(e){return this.callMe(e)}},e.debug=function(e,t){void 0===t&&(t=this.options);var s=this.callBlockLexer(e,t),r=s.tokens,o=s.links,h=r.slice(),a=new i.Parser(t);a.simpleRenderers=this.simpleRenderers;var p=a.debug(o,r);return{tokens:h=h.map((function(e){e.type=l.TokenType[e.type]||e.type;var t=e.line;return delete e.line,t?n({line:t},e):e})),links:o,result:p}},e.callBlockLexer=function(e,t){return void 0===e&&(e=""),e=e.replace(/\r\n|\r/g,"\n").replace(/\t/g,"    ").replace(/\u00a0/g," ").replace(/\u2424/g,"\n").replace(/^ +$/gm,""),r.BlockLexer.lex(e,t,!0)},e.callParser=function(e,t,s){if(this.simpleRenderers.length){var n=new i.Parser(s);return n.simpleRenderers=this.simpleRenderers,n.parse(t,e)}return i.Parser.parse(e,t,s)},e.callMe=function(e){if(e.message+="\nPlease report this to https://github.com/KostyaTretyak/marked-ts",this.options.silent)return"<p>An error occured:</p><pre>"+this.options.escape(e.message+"",!0)+"</pre>";throw e},e.options=new l.MarkedOptions,e.simpleRenderers=[],e}();t.Marked=h},165:function(e,t,s){"use strict";
/**
 * @license
 *
 * Copyright (c) 2018, Костя Третяк. (MIT Licensed)
 * https://github.com/KostyaTretyak/marked-ts
 */Object.defineProperty(t,"__esModule",{value:!0});var n=s(168);!function(e){e[e.space=1]="space",e[e.text=2]="text",e[e.paragraph=3]="paragraph",e[e.heading=4]="heading",e[e.listStart=5]="listStart",e[e.listEnd=6]="listEnd",e[e.looseItemStart=7]="looseItemStart",e[e.looseItemEnd=8]="looseItemEnd",e[e.listItemStart=9]="listItemStart",e[e.listItemEnd=10]="listItemEnd",e[e.blockquoteStart=11]="blockquoteStart",e[e.blockquoteEnd=12]="blockquoteEnd",e[e.code=13]="code",e[e.table=14]="table",e[e.html=15]="html",e[e.hr=16]="hr"}(t.TokenType||(t.TokenType={}));var i=function(){this.gfm=!0,this.tables=!0,this.breaks=!1,this.pedantic=!1,this.sanitize=!1,this.mangle=!0,this.smartLists=!1,this.silent=!1,this.langPrefix="lang-",this.smartypants=!1,this.headerPrefix="",this.xhtml=!1,this.escape=n.escape,this.unescape=n.unescape};t.MarkedOptions=i},166:function(e,t,s){"use strict";
/**
 * @license
 *
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 *
 * Copyright (c) 2018, Костя Третяк. (MIT Licensed)
 * https://github.com/KostyaTretyak/marked-ts
 */Object.defineProperty(t,"__esModule",{value:!0});var n=s(164),i=function(){function e(e){this.options=e||n.Marked.options}return e.prototype.code=function(e,t,s){if(this.options.highlight){var n=this.options.highlight(e,t);null!=n&&n!==e&&(s=!0,e=n)}return t?'\n<pre><code class="'+this.options.langPrefix+this.options.escape(t,!0)+'">'+(s?e:this.options.escape(e,!0))+"\n</code></pre>\n":"\n<pre><code>"+(s?e:this.options.escape(e,!0))+"\n</code></pre>\n"},e.prototype.blockquote=function(e){return"<blockquote>\n"+e+"</blockquote>\n"},e.prototype.html=function(e){return e},e.prototype.heading=function(e,t,s){return"<h"+t+' id="'+(this.options.headerPrefix+s.toLowerCase().replace(/[^\w]+/g,"-"))+'">'+e+"</h"+t+">\n"},e.prototype.hr=function(){return this.options.xhtml?"<hr/>\n":"<hr>\n"},e.prototype.list=function(e,t){var s=t?"ol":"ul";return"\n<"+s+">\n"+e+"</"+s+">\n"},e.prototype.listitem=function(e){return"<li>"+e+"</li>\n"},e.prototype.paragraph=function(e){return"<p>"+e+"</p>\n"},e.prototype.table=function(e,t){return"\n<table>\n<thead>\n"+e+"</thead>\n<tbody>\n"+t+"</tbody>\n</table>\n"},e.prototype.tablerow=function(e){return"<tr>\n"+e+"</tr>\n"},e.prototype.tablecell=function(e,t){var s=t.header?"th":"td";return(t.align?"<"+s+' style="text-align:'+t.align+'">':"<"+s+">")+e+"</"+s+">\n"},e.prototype.strong=function(e){return"<strong>"+e+"</strong>"},e.prototype.em=function(e){return"<em>"+e+"</em>"},e.prototype.codespan=function(e){return"<code>"+e+"</code>"},e.prototype.br=function(){return this.options.xhtml?"<br/>":"<br>"},e.prototype.del=function(e){return"<del>"+e+"</del>"},e.prototype.link=function(e,t,s){if(this.options.sanitize){var n=void 0;try{n=decodeURIComponent(this.options.unescape(e)).replace(/[^\w:]/g,"").toLowerCase()}catch(e){return s}if(0===n.indexOf("javascript:")||0===n.indexOf("vbscript:")||0===n.indexOf("data:"))return s}var i='<a href="'+e+'"';return t&&(i+=' title="'+t+'"'),i+=">"+s+"</a>"},e.prototype.image=function(e,t,s){var n='<img src="'+e+'" alt="'+s+'"';return t&&(n+=' title="'+t+'"'),n+=this.options.xhtml?"/>":">"},e.prototype.text=function(e){return e},e}();t.Renderer=i},167:function(e,t,s){"use strict";
/**
 * @license
 *
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 *
 * Copyright (c) 2018, Костя Третяк. (MIT Licensed)
 * https://github.com/KostyaTretyak/marked-ts
 */Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(e,t){void 0===t&&(t=""),this.source=e.source,this.flags=t}return e.prototype.setGroup=function(e,t){var s="string"==typeof t?t:t.source;return s=s.replace(/(^|[^\[])\^/g,"$1"),this.source=this.source.replace(e,s),this},e.prototype.getRegexp=function(){return new RegExp(this.source,this.flags)},e}();t.ExtendRegexp=n},168:function(e,t,s){"use strict";
/**
 * @license
 *
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 *
 * Copyright (c) 2018, Костя Третяк. (MIT Licensed)
 * https://github.com/KostyaTretyak/marked-ts
 */Object.defineProperty(t,"__esModule",{value:!0}),t.merge=function(e){for(var t=[],s=1;s<arguments.length;s++)t[s-1]=arguments[s];for(var n=0;n<t.length;n++){var i=t[n];for(var r in i)e[r]=i[r]}return e};var n=/[&<>"']/,i=/[&<>"']/g,r={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},o=/[<>"']|&(?!#?\w+;)/,l=/[<>"']|&(?!#?\w+;)/g;t.escape=function(e,t){if(t){if(n.test(e))return e.replace(i,(function(e){return r[e]}))}else if(o.test(e))return e.replace(l,(function(e){return r[e]}));return e},t.unescape=function(e){return e.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/gi,(function(e,t){return"colon"===(t=t.toLowerCase())?":":"#"===t.charAt(0)?"x"===t.charAt(1)?String.fromCharCode(parseInt(t.substring(2),16)):String.fromCharCode(+t.substring(1)):""}))}},169:function(e,t,s){"use strict";
/**
 * @license
 *
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 *
 * Copyright (c) 2018, Костя Третяк. (MIT Licensed)
 * https://github.com/KostyaTretyak/marked-ts
 */var n=this&&this.__assign||Object.assign||function(e){for(var t,s=1,n=arguments.length;s<n;s++)for(var i in t=arguments[s])Object.prototype.hasOwnProperty.call(t,i)&&(e[i]=t[i]);return e};Object.defineProperty(t,"__esModule",{value:!0});var i=s(164),r=s(167),o=s(165),l=function(){function e(e,t){this.staticThis=e,this.links={},this.tokens=[],this.options=t||i.Marked.options,this.setRules()}return e.lex=function(e,t,s,n){return new this(this,t).getTokens(e,s,n)},e.getRulesBase=function(){if(this.rulesBase)return this.rulesBase;var e={newline:/^\n+/,code:/^( {4}[^\n]+\n*)+/,hr:/^( *[-*_]){3,} *(?:\n+|$)/,heading:/^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,lheading:/^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,blockquote:/^( *>[^\n]+(\n[^\n]+)*\n*)+/,list:/^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,html:/^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,paragraph:/^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,text:/^[^\n]+/,bullet:/(?:[*+-]|\d+\.)/,item:/^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/};e.item=new r.ExtendRegexp(e.item,"gm").setGroup(/bull/g,e.bullet).getRegexp(),e.list=new r.ExtendRegexp(e.list).setGroup(/bull/g,e.bullet).setGroup("hr","\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))").setGroup("def","\\n+(?="+e.def.source+")").getRegexp();var t="(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b";return e.html=new r.ExtendRegexp(e.html).setGroup("comment",/<!--[\s\S]*?-->/).setGroup("closed",/<(tag)[\s\S]+?<\/\1>/).setGroup("closing",/<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/).setGroup(/tag/g,t).getRegexp(),e.paragraph=new r.ExtendRegexp(e.paragraph).setGroup("hr",e.hr).setGroup("heading",e.heading).setGroup("lheading",e.lheading).setGroup("blockquote",e.blockquote).setGroup("tag","<"+t).setGroup("def",e.def).getRegexp(),this.rulesBase=e},e.getRulesGfm=function(){if(this.rulesGfm)return this.rulesGfm;var e=this.getRulesBase(),t=n({},e,{fences:/^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/,paragraph:/^/,heading:/^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/}),s=t.fences.source.replace("\\1","\\2"),i=e.list.source.replace("\\1","\\3");return t.paragraph=new r.ExtendRegexp(e.paragraph).setGroup("(?!","(?!"+s+"|"+i+"|").getRegexp(),this.rulesGfm=t},e.getRulesTable=function(){return this.rulesTables?this.rulesTables:this.rulesTables=n({},this.getRulesGfm(),{nptable:/^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,table:/^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/})},e.prototype.setRules=function(){this.options.gfm?this.options.tables?this.rules=this.staticThis.getRulesTable():this.rules=this.staticThis.getRulesGfm():this.rules=this.staticThis.getRulesBase(),this.hasRulesGfm=void 0!==this.rules.fences,this.hasRulesTables=void 0!==this.rules.table},e.prototype.getTokens=function(e,t,s){var n,i=e;e:for(;i;)if((n=this.rules.newline.exec(i))&&(i=i.substring(n[0].length),n[0].length>1&&this.tokens.push({type:o.TokenType.space})),n=this.rules.code.exec(i)){i=i.substring(n[0].length);var r=n[0].replace(/^ {4}/gm,"");this.tokens.push({type:o.TokenType.code,text:this.options.pedantic?r:r.replace(/\n+$/,"")})}else if(this.hasRulesGfm&&(n=this.rules.fences.exec(i)))i=i.substring(n[0].length),this.tokens.push({type:o.TokenType.code,lang:n[2],text:n[3]||""});else if(n=this.rules.heading.exec(i))i=i.substring(n[0].length),this.tokens.push({type:o.TokenType.heading,depth:n[1].length,text:n[2]});else if(t&&this.hasRulesTables&&(n=this.rules.nptable.exec(i))){i=i.substring(n[0].length);for(var l={type:o.TokenType.table,header:n[1].replace(/^ *| *\| *$/g,"").split(/ *\| */),align:n[2].replace(/^ *|\| *$/g,"").split(/ *\| */),cells:[]},h=0;h<l.align.length;h++)/^ *-+: *$/.test(l.align[h])?l.align[h]="right":/^ *:-+: *$/.test(l.align[h])?l.align[h]="center":/^ *:-+ *$/.test(l.align[h])?l.align[h]="left":l.align[h]=null;var a=n[3].replace(/\n$/,"").split("\n");for(h=0;h<a.length;h++)l.cells[h]=a[h].split(/ *\| */);this.tokens.push(l)}else if(n=this.rules.lheading.exec(i))i=i.substring(n[0].length),this.tokens.push({type:o.TokenType.heading,depth:"="===n[2]?1:2,text:n[1]});else if(n=this.rules.hr.exec(i))i=i.substring(n[0].length),this.tokens.push({type:o.TokenType.hr});else if(n=this.rules.blockquote.exec(i)){i=i.substring(n[0].length),this.tokens.push({type:o.TokenType.blockquoteStart});var p=n[0].replace(/^ *> ?/gm,"");this.getTokens(p),this.tokens.push({type:o.TokenType.blockquoteEnd})}else if(n=this.rules.list.exec(i)){i=i.substring(n[0].length);var u=n[2];this.tokens.push({type:o.TokenType.listStart,ordered:u.length>1});var c=(p=n[0].match(this.rules.item)).length,g=!1,d=void 0,f=void 0,k=void 0;for(h=0;h<c;h++){d=(l=p[h]).length,-1!==(l=l.replace(/^ *([*+-]|\d+\.) +/,"")).indexOf("\n ")&&(d-=l.length,l=this.options.pedantic?l.replace(/^ {1,4}/gm,""):l.replace(new RegExp("^ {1,"+d+"}","gm"),"")),this.options.smartLists&&h!==c-1&&(u===(f=this.staticThis.getRulesBase().bullet.exec(p[h+1])[0])||u.length>1&&f.length>1||(i=p.slice(h+1).join("\n")+i,h=c-1)),k=g||/\n\n(?!\s*$)/.test(l),h!==c-1&&(g="\n"===l.charAt(l.length-1),k||(k=g)),this.tokens.push({type:k?o.TokenType.looseItemStart:o.TokenType.listItemStart}),this.getTokens(l,!1,s),this.tokens.push({type:o.TokenType.listItemEnd})}this.tokens.push({type:o.TokenType.listEnd})}else if(n=this.rules.html.exec(i)){i=i.substring(n[0].length);var x=n[1],y="pre"===x||"script"===x||"style"===x;this.tokens.push({type:this.options.sanitize?o.TokenType.paragraph:o.TokenType.html,pre:!this.options.sanitizer&&y,text:n[0]})}else if(t&&(n=this.rules.def.exec(i)))i=i.substring(n[0].length),this.links[n[1].toLowerCase()]={href:n[2],title:n[3]};else if(t&&this.hasRulesTables&&(n=this.rules.table.exec(i))){i=i.substring(n[0].length);for(l={type:o.TokenType.table,header:n[1].replace(/^ *| *\| *$/g,"").split(/ *\| */),align:n[2].replace(/^ *|\| *$/g,"").split(/ *\| */),cells:[]},h=0;h<l.align.length;h++)/^ *-+: *$/.test(l.align[h])?l.align[h]="right":/^ *:-+: *$/.test(l.align[h])?l.align[h]="center":/^ *:-+ *$/.test(l.align[h])?l.align[h]="left":l.align[h]=null;for(a=n[3].replace(/(?: *\| *)?\n$/,"").split("\n"),h=0;h<a.length;h++)l.cells[h]=a[h].replace(/^ *\| *| *\| *$/g,"").split(/ *\| */);this.tokens.push(l)}else{if(this.staticThis.simpleRules.length){var b=this.staticThis.simpleRules;for(h=0;h<b.length;h++)if(n=b[h].exec(i)){i=i.substring(n[0].length);var m="simpleRule"+(h+1);this.tokens.push({type:m,execArr:n});continue e}}if(t&&(n=this.rules.paragraph.exec(i)))i=i.substring(n[0].length),"\n"===n[1].slice(-1)?this.tokens.push({type:o.TokenType.paragraph,text:n[1].slice(0,-1)}):this.tokens.push({type:this.tokens.length>0?o.TokenType.paragraph:o.TokenType.text,text:n[1]});else if(n=this.rules.text.exec(i))i=i.substring(n[0].length),this.tokens.push({type:o.TokenType.text,text:n[0]});else if(i)throw new Error("Infinite loop on byte: "+i.charCodeAt(0)+", near text '"+i.slice(0,30)+"...'")}return{tokens:this.tokens,links:this.links}},e.simpleRules=[],e}();t.BlockLexer=l},170:function(e,t,s){"use strict";
/**
 * @license
 *
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 *
 * Copyright (c) 2018, Костя Третяк. (MIT Licensed)
 * https://github.com/KostyaTretyak/marked-ts
 */Object.defineProperty(t,"__esModule",{value:!0});var n=s(164),i=s(166),r=s(171),o=s(165),l=function(){function e(e){this.simpleRenderers=[],this.line=0,this.tokens=[],this.token=null,this.options=e||n.Marked.options,this.renderer=this.options.renderer||new i.Renderer(this.options)}return e.parse=function(e,t,s){return new this(s).parse(t,e)},e.prototype.parse=function(e,t){this.inlineLexer=new r.InlineLexer(r.InlineLexer,e,this.options,this.renderer),this.tokens=t.reverse();for(var s="";this.next();)s+=this.tok();return s},e.prototype.debug=function(e,t){this.inlineLexer=new r.InlineLexer(r.InlineLexer,e,this.options,this.renderer),this.tokens=t.reverse();for(var s="";this.next();){var n=this.tok();this.token.line=this.line+=n.split("\n").length-1,s+=n}return s},e.prototype.next=function(){return this.token=this.tokens.pop()},e.prototype.getNextElement=function(){return this.tokens[this.tokens.length-1]},e.prototype.parseText=function(){for(var e,t=this.token.text;(e=this.getNextElement())&&e.type==o.TokenType.text;)t+="\n"+this.next().text;return this.inlineLexer.output(t)},e.prototype.tok=function(){switch(this.token.type){case o.TokenType.space:return"";case o.TokenType.paragraph:return this.renderer.paragraph(this.inlineLexer.output(this.token.text));case o.TokenType.text:return this.options.isNoP?this.parseText():this.renderer.paragraph(this.parseText());case o.TokenType.heading:return this.renderer.heading(this.inlineLexer.output(this.token.text),this.token.depth,this.token.text);case o.TokenType.listStart:for(var e="",t=this.token.ordered;this.next().type!=o.TokenType.listEnd;)e+=this.tok();return this.renderer.list(e,t);case o.TokenType.listItemStart:for(e="";this.next().type!=o.TokenType.listItemEnd;)e+=this.token.type==o.TokenType.text?this.parseText():this.tok();return this.renderer.listitem(e);case o.TokenType.looseItemStart:for(e="";this.next().type!=o.TokenType.listItemEnd;)e+=this.tok();return this.renderer.listitem(e);case o.TokenType.code:return this.renderer.code(this.token.text,this.token.lang,this.token.escaped);case o.TokenType.table:var s="",n=(e="",void 0),i=void 0;i="";for(var r=0;r<this.token.header.length;r++){var l={header:!0,align:this.token.align[r]},h=this.inlineLexer.output(this.token.header[r]);i+=this.renderer.tablecell(h,l)}s+=this.renderer.tablerow(i);for(r=0;r<this.token.cells.length;r++){n=this.token.cells[r],i="";for(var a=0;a<n.length;a++)i+=this.renderer.tablecell(this.inlineLexer.output(n[a]),{header:!1,align:this.token.align[a]});e+=this.renderer.tablerow(i)}return this.renderer.table(s,e);case o.TokenType.blockquoteStart:for(e="";this.next().type!=o.TokenType.blockquoteEnd;)e+=this.tok();return this.renderer.blockquote(e);case o.TokenType.hr:return this.renderer.hr();case o.TokenType.html:var p=this.token.pre||this.options.pedantic?this.token.text:this.inlineLexer.output(this.token.text);return this.renderer.html(p);default:if(this.simpleRenderers.length)for(r=0;r<this.simpleRenderers.length;r++)if(this.token.type=="simpleRule"+(r+1))return this.simpleRenderers[r].call(this.renderer,this.token.execArr);var u='Token with "'+this.token.type+'" type was not found.';if(!this.options.silent)throw new Error(u);console.log(u)}},e}();t.Parser=l},171:function(e,t,s){"use strict";
/**
 * @license
 *
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 *
 * Copyright (c) 2018, Костя Третяк. (MIT Licensed)
 * https://github.com/KostyaTretyak/marked-ts
 */var n=this&&this.__assign||Object.assign||function(e){for(var t,s=1,n=arguments.length;s<n;s++)for(var i in t=arguments[s])Object.prototype.hasOwnProperty.call(t,i)&&(e[i]=t[i]);return e};Object.defineProperty(t,"__esModule",{value:!0});var i=s(167),r=s(164),o=s(166),l=function(){function e(e,t,s,n){if(void 0===s&&(s=r.Marked.options),this.staticThis=e,this.links=t,this.options=s,this.renderer=n||this.options.renderer||new o.Renderer(this.options),!this.links)throw new Error("InlineLexer requires 'links' parameter.");this.setRules()}return e.output=function(e,t,s){return new this(this,t,s).output(e)},e.getRulesBase=function(){if(this.rulesBase)return this.rulesBase;var e={escape:/^\\([\\`*{}\[\]()#+\-.!_>])/,autolink:/^<([^ <>]+(@|:\/)[^ <>]+)>/,tag:/^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^<'">])*?>/,link:/^!?\[(inside)\]\(href\)/,reflink:/^!?\[(inside)\]\s*\[([^\]]*)\]/,nolink:/^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,strong:/^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,em:/^\b_((?:[^_]|__)+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,code:/^(`+)([\s\S]*?[^`])\1(?!`)/,br:/^ {2,}\n(?!\s*$)/,text:/^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/,_inside:/(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/,_href:/\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/};return e.link=new i.ExtendRegexp(e.link).setGroup("inside",e._inside).setGroup("href",e._href).getRegexp(),e.reflink=new i.ExtendRegexp(e.reflink).setGroup("inside",e._inside).getRegexp(),this.rulesBase=e},e.getRulesPedantic=function(){return this.rulesPedantic?this.rulesPedantic:this.rulesPedantic=n({},this.getRulesBase(),{strong:/^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,em:/^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/})},e.getRulesGfm=function(){if(this.rulesGfm)return this.rulesGfm;var e=this.getRulesBase(),t=new i.ExtendRegexp(e.escape).setGroup("])","~|])").getRegexp(),s=new i.ExtendRegexp(e.text).setGroup("]|","~]|").setGroup("|","|https?://|").getRegexp();return this.rulesGfm=n({},e,{escape:t,url:/^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,del:/^~~(?=\S)([\s\S]*?\S)~~/,text:s})},e.getRulesBreaks=function(){if(this.rulesBreaks)return this.rulesBreaks;var e=this.getRulesGfm(),t=this.getRulesGfm();return this.rulesBreaks=n({},t,{br:new i.ExtendRegexp(e.br).setGroup("{2,}","*").getRegexp(),text:new i.ExtendRegexp(t.text).setGroup("{2,}","*").getRegexp()})},e.prototype.setRules=function(){this.options.gfm?this.options.breaks?this.rules=this.staticThis.getRulesBreaks():this.rules=this.staticThis.getRulesGfm():this.options.pedantic?this.rules=this.staticThis.getRulesPedantic():this.rules=this.staticThis.getRulesBase(),this.hasRulesGfm=void 0!==this.rules.url},e.prototype.output=function(e){var t;e=e;for(var s="";e;)if(t=this.rules.escape.exec(e))e=e.substring(t[0].length),s+=t[1];else if(t=this.rules.autolink.exec(e)){var n=void 0,i=void 0;e=e.substring(t[0].length),"@"===t[2]?(n=this.options.escape(":"===t[1].charAt(6)?this.mangle(t[1].substring(7)):this.mangle(t[1])),i=this.mangle("mailto:")+n):i=n=this.options.escape(t[1]),s+=this.renderer.link(i,null,n)}else if(!this.inLink&&this.hasRulesGfm&&(t=this.rules.url.exec(e))){n=void 0,i=void 0;e=e.substring(t[0].length),i=n=this.options.escape(t[1]),s+=this.renderer.link(i,null,n)}else if(t=this.rules.tag.exec(e))!this.inLink&&/^<a /i.test(t[0])?this.inLink=!0:this.inLink&&/^<\/a>/i.test(t[0])&&(this.inLink=!1),e=e.substring(t[0].length),s+=this.options.sanitize?this.options.sanitizer?this.options.sanitizer(t[0]):this.options.escape(t[0]):t[0];else if(t=this.rules.link.exec(e))e=e.substring(t[0].length),this.inLink=!0,s+=this.outputLink(t,{href:t[2],title:t[3]}),this.inLink=!1;else if((t=this.rules.reflink.exec(e))||(t=this.rules.nolink.exec(e))){e=e.substring(t[0].length);var r=(t[2]||t[1]).replace(/\s+/g," "),o=this.links[r.toLowerCase()];if(!o||!o.href){s+=t[0].charAt(0),e=t[0].substring(1)+e;continue}this.inLink=!0,s+=this.outputLink(t,o),this.inLink=!1}else if(t=this.rules.strong.exec(e))e=e.substring(t[0].length),s+=this.renderer.strong(this.output(t[2]||t[1]));else if(t=this.rules.em.exec(e))e=e.substring(t[0].length),s+=this.renderer.em(this.output(t[2]||t[1]));else if(t=this.rules.code.exec(e))e=e.substring(t[0].length),s+=this.renderer.codespan(this.options.escape(t[2].trim(),!0));else if(t=this.rules.br.exec(e))e=e.substring(t[0].length),s+=this.renderer.br();else if(this.hasRulesGfm&&(t=this.rules.del.exec(e)))e=e.substring(t[0].length),s+=this.renderer.del(this.output(t[1]));else if(t=this.rules.text.exec(e))e=e.substring(t[0].length),s+=this.renderer.text(this.options.escape(this.smartypants(t[0])));else if(e)throw new Error("Infinite loop on byte: "+e.charCodeAt(0));return s},e.prototype.outputLink=function(e,t){var s=this.options.escape(t.href),n=t.title?this.options.escape(t.title):null;return"!"!==e[0].charAt(0)?this.renderer.link(s,n,this.output(e[1])):this.renderer.image(s,n,this.options.escape(e[1]))},e.prototype.smartypants=function(e){return this.options.smartypants?e.replace(/---/g,"—").replace(/--/g,"–").replace(/(^|[-\u2014/(\[{"\s])'/g,"$1‘").replace(/'/g,"’").replace(/(^|[-\u2014/(\[{\u2018\s])"/g,"$1“").replace(/"/g,"”").replace(/\.{3}/g,"…"):e},e.prototype.mangle=function(e){if(!this.options.mangle)return e;for(var t="",s=e.length,n=0;n<s;n++){var i=void 0;Math.random()>.5&&(i="x"+e.charCodeAt(n).toString(16)),t+="&#"+i+";"}return t},e}();t.InlineLexer=l},181:function(e,t,s){"use strict";function n(e){for(var s in e)t.hasOwnProperty(s)||(t[s]=e[s])}Object.defineProperty(t,"__esModule",{value:!0}),n(s(169)),n(s(168)),n(s(171)),n(s(165)),n(s(164)),n(s(170)),n(s(166)),n(s(167))}}]);