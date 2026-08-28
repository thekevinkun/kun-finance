// Sanity-check test to confirm Vitest is wired up correctly.
// Verifies the Prisma client singleton can be imported without throwing.
import { describe, it, expect } from "vitest";
import { db } from "./db";

describe("db client", () => {
  it("should be defined", () => {
    // A minimal assertion — just proves the import + Vitest runner work end-to-end
    expect(db).toBeDefined();
  });
});
