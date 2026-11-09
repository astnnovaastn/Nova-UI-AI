// Rewrites every stylesheet rule so it can only affect elements inside the canvas root.
// Without this, Zephium's global CSS changed about 27% of AEGIS's page elements.
import postcss from "postcss";

const ROOT = ".aegis-work-root";

/** Splits on commas that are not inside brackets or parentheses. */
function splitSelectors(list) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of list) {
    if ("([".includes(char)) depth++;
    if (")]".includes(char)) depth--;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function scopeSelector(selector) {
  let rest = selector.trim();
  if (rest.startsWith(ROOT)) return rest;
  // The document's own elements become the canvas root, keeping any attribute conditions.
  const document = rest.match(/^(?::root|:host|html|body)(?![\w-])/);
  if (document) {
    rest = ROOT + rest.slice(document[0].length);
    rest = rest.replace(/(\s+)(?:html|body|#root|\.shell)(?![\w-])/g, "");
    return rest;
  }
  if (/^#root(?![\w-])/.test(rest)) return ROOT + rest.slice(5);
  // A leading attribute such as [data-theme="light"] is set on the root itself.
  if (rest.startsWith("[")) return ROOT + rest;
  return `${ROOT} ${rest}`;
}


export function scope(css) {
  const tree = postcss.parse(css);
  tree.walkRules((rule) => {
    const parent = rule.parent;
    if (parent?.type === "atrule" && /keyframes$/i.test(parent.name)) return;
    rule.selector = splitSelectors(rule.selector).map(scopeSelector).join(", ");
  });
  return tree.toString();
}

/** Vite plugin: scopes the emitted stylesheet when the bundle is written. */
export function scopedStyles() {
  return {
    name: "aegis-scoped-styles",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const asset of Object.values(bundle)) {
        if (asset.type === "asset" && asset.fileName.endsWith(".css")) {
          asset.source = scope(String(asset.source));
        }
      }
    },
  };
}
