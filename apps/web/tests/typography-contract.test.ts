import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

const css = read("../src/app/globals.css");
const layout = read("../src/app/layout.tsx");
const tokenSource = read("../src/design-system/tokens/typography.ts");

const SERIF_FIRST = "Source Serif 4 Variable";
const SANS_FIRST = "Source Sans 3 Variable";

/** Body of the first `selector { ... }` block; flat blocks only. */
function readBlock(source: string, selector: string): string {
  const start = source.indexOf(selector);
  if (start === -1) throw new Error(`Missing block: ${selector}`);

  let depth = 0;
  for (let index = source.indexOf("{", start); index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(source.indexOf("{", start) + 1, index);
      }
    }
  }

  throw new Error(`Unbalanced block: ${selector}`);
}

const theme = readBlock(css, "@theme");
const prose = readBlock(css, "\n.prose-article {");
const body = readBlock(css, "\nbody {");

describe("typography contract", () => {
  it("self-hosts both families through Fontsource instead of a font CDN", () => {
    const stylesheets = [
      "@fontsource-variable/source-sans-3/wght.css",
      "@fontsource-variable/source-sans-3/wght-italic.css",
      "@fontsource-variable/source-serif-4/opsz.css",
      "@fontsource-variable/source-serif-4/opsz-italic.css",
    ];

    for (const stylesheet of stylesheets) {
      expect(layout).toContain(`import "${stylesheet}";`);
    }

    expect(layout).not.toMatch(/next\/font|fonts\.googleapis\.com/);
  });

  it("leads every family stack with the self-hosted face", () => {
    const sans = theme.match(/--font-sans:\s*([^;]+);/)?.[1] ?? "";
    const display = theme.match(/--font-display:\s*([^;]+);/)?.[1] ?? "";
    const serif = theme.match(/--font-serif:\s*([^;]+);/)?.[1] ?? "";

    expect(sans.trimStart().startsWith(`"${SANS_FIRST}"`)).toBe(true);
    expect(display.trimStart().startsWith(`"${SERIF_FIRST}"`)).toBe(true);
    expect(serif.trimStart().startsWith(`"${SERIF_FIRST}"`)).toBe(true);
  });

  it("keeps the legacy family aliases pointing at the new stacks", () => {
    for (const alias of [
      "--font-family-sans",
      "--font-family-inter",
      "--font-family-serif",
      "--font-family-display",
    ]) {
      expect(css).toMatch(new RegExp(`${alias}:\\s*var\\(--font-(?:sans|serif|display)\\);`));
    }
  });

  it("sets optical sizing and kerning on body text", () => {
    expect(body).toContain("font-optical-sizing: auto");
    expect(body).toContain("font-kerning: normal");
  });

  it("sets the article prose in the editorial face at a capped measure", () => {
    expect(prose).toContain("font-family: var(--font-display)");
    expect(prose).toContain("max-inline-size: 68ch");
    expect(prose).toContain("color: var(--color-ink)");
  });

  it("keeps article prose on semantic tokens", () => {
    const legacy = prose.match(
      /var\(--color-(?:text|background|border)-[a-z-]+\)/g,
    );
    expect(legacy).toBeNull();
    expect(prose.match(/#[0-9a-fA-F]{6}\b/g)).toBeNull();
  });

  it("mirrors the families in the TypeScript tokens", () => {
    const families = tokenSource.match(/'Source (?:Serif 4|Sans 3) Variable'/g) ?? [];
    expect(families.length).toBeGreaterThanOrEqual(4);
    expect(tokenSource).toContain("'--font-family-display': fontFamily.display");
  });
});
