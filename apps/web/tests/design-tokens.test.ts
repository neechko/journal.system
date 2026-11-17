import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = fileURLToPath(
  new URL("../src/app/globals.css", import.meta.url),
);
const css = readFileSync(cssPath, "utf8");

function collectDefinedVariables(source: string): Set<string> {
  const defined = new Set<string>();
  for (const match of source.matchAll(/(?:^|[\s{;])(--[a-zA-Z0-9-]+)\s*:/g)) {
    defined.add(match[1]);
  }
  return defined;
}

function collectUsedVariables(source: string): Set<string> {
  const used = new Set<string>();
  for (const match of source.matchAll(/var\((--[a-zA-Z0-9-]+)/g)) {
    used.add(match[1]);
  }
  return used;
}

/**
 * Removes every `@layer name { ... }` block so the remaining text is exactly the
 * unlayered CSS. Unlayered element rules beat Tailwind utilities, which is how
 * the typography in this app broke before.
 */
function stripLayerBlocks(source: string): string {
  let output = "";
  let index = 0;

  while (index < source.length) {
    const layerStart = source.indexOf("@layer", index);
    if (layerStart === -1) {
      output += source.slice(index);
      break;
    }

    const openBrace = source.indexOf("{", layerStart);
    const semicolon = source.indexOf(";", layerStart);

    // Layer declarations such as `@layer theme, base, components, utilities;`
    if (semicolon !== -1 && (openBrace === -1 || semicolon < openBrace)) {
      output += source.slice(index, semicolon + 1);
      index = semicolon + 1;
      continue;
    }

    output += source.slice(index, layerStart);

    let depth = 0;
    let cursor = openBrace;
    for (; cursor < source.length; cursor += 1) {
      if (source[cursor] === "{") depth += 1;
      if (source[cursor] === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
    }

    index = cursor + 1;
  }

  return output;
}

describe("design tokens", () => {
  it("defines every custom property that globals.css references", () => {
    const defined = collectDefinedVariables(css);
    const missing = [...collectUsedVariables(css)]
      .filter((name) => !defined.has(name))
      .sort();

    expect(missing).toEqual([]);
  });

  it("keeps element typography inside @layer base so utilities can override it", () => {
    const unlayered = stripLayerBlocks(css);

    for (const selector of ["h1", "h2", "h3", "p", "a"]) {
      const rule = new RegExp(`(^|\\})${selector}\\s*[,{]`, "m");
      expect(unlayered).not.toMatch(rule);
    }
  });

  it("ships an article prose style without the typography plugin", () => {
    expect(css).toContain(".prose-article");
    expect(css).not.toContain('@plugin "@tailwindcss/typography"');
  });
});
