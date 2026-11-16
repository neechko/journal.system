import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicSiteHeader } from "../src/components/public-site-header";

describe("public site header", () => {
  it("keeps all public navigation links available in the mobile menu", () => {
    const markup = renderToStaticMarkup(createElement(PublicSiteHeader));
    const mobileMenu = markup.match(
      /<details class="relative md:hidden">([\s\S]*?)<\/details>/,
    );

    expect(mobileMenu).not.toBeNull();
    expect(mobileMenu?.[1]).toContain("<summary");
    expect(mobileMenu?.[1]).toContain('aria-label="Main navigation"');
    expect(mobileMenu?.[1]).toContain('href="/journals"');
    expect(mobileMenu?.[1]).toContain('href="/#platform"');
    expect(mobileMenu?.[1]).toContain('href="/admin/organizations"');
  });
});
