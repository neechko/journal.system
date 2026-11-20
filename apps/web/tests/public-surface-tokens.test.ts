import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = fileURLToPath(
  new URL("../src/app/globals.css", import.meta.url),
);
const css = readFileSync(cssPath, "utf8");

const publicSurfaces = [
  "../src/app/page.tsx",
  "../src/app/journals/page.tsx",
  "../src/app/journals/[organizationSlug]/[journalSlug]/page.tsx",
  "../src/components/public-site-header.tsx",
  "../src/components/public-site-footer.tsx",
];

/**
 * Returns the body of the first `selector { ... }` block. Brace counting is
 * enough for the flat token blocks used here.
 */
function readBlock(source: string, selector: string): string {
  const start = source.indexOf(selector);
  if (start === -1) {
    throw new Error(`Missing block: ${selector}`);
  }

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

function readColor(block: string, token: string): string {
  const match = block.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})\\s*;`));
  if (!match) {
    throw new Error(`Missing color token: ${token}`);
  }
  return match[1];
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first: string, second: string): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

const light = readBlock(css, "@theme");
const dark = readBlock(css, '[data-theme="dark"]');

describe("public surface tokens", () => {
  it("keeps control boundaries at 3:1 against both paper surfaces in light mode", () => {
    const border = readColor(light, "--color-line-strong");
    expect(contrast(border, readColor(light, "--color-paper"))).toBeGreaterThanOrEqual(3);
    expect(contrast(border, readColor(light, "--color-paper-deep"))).toBeGreaterThanOrEqual(3);
  });

  it("keeps control boundaries at 3:1 against the dark paper surface", () => {
    const border = readColor(dark, "--color-line-strong");
    expect(contrast(border, readColor(dark, "--color-paper"))).toBeGreaterThanOrEqual(3);
  });

  it("keeps brand panel text readable in both themes", () => {
    for (const theme of [light, dark]) {
      expect(contrast(readColor(theme, "--color-brand-ink"), readColor(theme, "--color-brand"))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(readColor(theme, "--color-brand-muted"), readColor(theme, "--color-brand"))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(readColor(theme, "--color-brand-muted"), readColor(theme, "--color-brand-raised"))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(readColor(theme, "--color-brand-accent"), readColor(theme, "--color-brand-raised"))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(readColor(theme, "--color-brand-accent-ink"), readColor(theme, "--color-brand-accent"))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(publicSurfaces)("uses tokens instead of raw hex in %s", (relativePath) => {
    const source = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
    expect(source.match(/#[0-9a-fA-F]{6}\b/g) ?? []).toEqual([]);
  });

  it("defines every brand utility the public surfaces reference", () => {
    const used = new Set<string>();

    for (const relativePath of publicSurfaces) {
      const source = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
      for (const match of source.matchAll(/(?:bg|text|border|divide|decoration|outline|ring|fill|stroke)-(brand(?:-[a-z-]+)?|line-strong)/g)) {
        used.add(`--color-${match[1]}`);
      }
    }

    expect([...used].length).toBeGreaterThan(0);

    for (const token of used) {
      expect(light).toContain(`${token}:`);
      expect(dark).toContain(`${token}:`);
    }
  });
});
