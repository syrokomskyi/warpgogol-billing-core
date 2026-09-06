// @vitest-environment node

import { describe, expect, it } from "vitest";

import * as mod from "./kernel-module.ts";

describe("billing kernel-module (load verification)", () => {
  it("module loads successfully", () => {
    expect(mod).toBeDefined();
  });
});
