import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JournalProfilePreview } from "../src/modules/tenancy/presentation/journal-profile-preview";

describe("journal profile preview", () => {
  it("renders saved profile content and honest empty states", () => {
    const markup = renderToStaticMarkup(
      createElement(JournalProfilePreview, {
        organizationName: "Institution A",
        journal: {
          id: "00000000-0000-4000-8000-000000000001",
          title: "Journal A",
          description: "A synthetic journal description.",
          aimsScope: "Research on scholarly publishing.",
          authorGuidelines: null,
        },
      }),
    );

    expect(markup).toContain("Private draft preview");
    expect(markup).toContain("Institution A");
    expect(markup).toContain("Journal A");
    expect(markup).toContain("A synthetic journal description.");
    expect(markup).toContain("Research on scholarly publishing.");
    expect(markup).toContain("Author guidelines have not been provided yet.");
    expect(markup).toContain("Publishing the journal remains a separate action.");
  });
});
