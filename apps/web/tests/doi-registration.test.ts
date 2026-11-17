import { describe, expect, it } from "vitest";
import { registerDoiUseCase } from "../src/modules/production/application/use-cases";

describe("DOI registration boundary", () => {
  it("does not persist or claim a Crossref registration without a deposit flow", async () => {
    await expect(registerDoiUseCase()).rejects.toMatchObject({
      code: "INVALID_STATE",
    });
  });
});
