import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getDatabase } from "../src/server/db/client";

afterEach(() => vi.unstubAllEnvs());

describe("runtime database configuration", () => {
  it("does not use the direct migration connection when runtime URL is absent", () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("DIRECT_DATABASE_URL", "postgres://migration-only@example.invalid/db");

    expect(() => getDatabase()).toThrowError(
      "Database has not been configured.",
    );
  });
});
