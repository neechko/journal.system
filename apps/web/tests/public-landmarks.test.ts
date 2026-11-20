import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appDir = fileURLToPath(new URL("../src/app", import.meta.url));

function listTsx(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
    .map((entry) => join(entry.parentPath, entry.name));
}

/**
 * Returns the source range of every `<main>` element in a file. The public
 * pages keep a single flat `<main>` per return block, so tag scanning is
 * enough and avoids pulling a JSX parser into the test.
 */
function mainRanges(source: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  let cursor = 0;

  while (cursor < source.length) {
    const start = source.indexOf("<main", cursor);
    if (start === -1) break;

    const end = source.indexOf("</main>", start);
    expect(end, "every <main> needs a closing tag").toBeGreaterThan(start);

    ranges.push({ start, end });
    cursor = end + "</main>".length;
  }

  return ranges;
}

const pages = listTsx(appDir).filter((file) => readFileSync(file, "utf8").includes("<PublicSiteHeader"));

describe("public page landmarks", () => {
  it("covers every page that renders the public header", () => {
    expect(pages.length).toBeGreaterThanOrEqual(8);
  });

  it.each(pages.map((file) => [file.slice(appDir.length + 1), file]))(
    "keeps the site header and footer outside <main> in %s",
    (_relativePath, file) => {
      const source = readFileSync(file, "utf8");

      for (const range of mainRanges(source)) {
        const body = source.slice(range.start, range.end);
        expect(body).not.toContain("<PublicSiteHeader");
        expect(body).not.toContain("<PublicSiteFooter");
      }
    },
  );
});
