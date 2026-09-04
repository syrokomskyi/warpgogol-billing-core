import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { nextRevision, isMonotonic, isGapTolerant } from "../billing-revision.ts";

describe("nextRevision", () => {
  it("returns current + 1", () => {
    expect(nextRevision(0)).toBe(1);
    expect(nextRevision(5)).toBe(6);
    expect(nextRevision(100)).toBe(101);
  });

  it("is always greater than input", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000000 }), (n) => {
        expect(nextRevision(n)).toBeGreaterThan(n);
      }),
    );
  });
});

describe("isMonotonic", () => {
  it("returns true for strictly increasing sequences", () => {
    expect(isMonotonic([1, 2, 3])).toBe(true);
    expect(isMonotonic([0, 1, 5, 10])).toBe(true);
  });

  it("returns false for non-increasing sequences", () => {
    expect(isMonotonic([3, 2, 1])).toBe(false);
    expect(isMonotonic([1, 1, 2])).toBe(false);
    expect(isMonotonic([1, 3, 2])).toBe(false);
  });

  it("returns true for empty and single-element sequences", () => {
    expect(isMonotonic([])).toBe(true);
    expect(isMonotonic([42])).toBe(true);
  });

  it("property: any sorted-ascending unique sequence is monotonic", () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 50 }).map((arr) =>
          [...arr].sort((a, b) => a - b),
        ),
        (sorted) => {
          expect(isMonotonic(sorted)).toBe(true);
        },
      ),
    );
  });
});

describe("isGapTolerant", () => {
  it("returns true for sequences with gaps but non-decreasing", () => {
    expect(isGapTolerant([1, 5, 10])).toBe(true);
    expect(isGapTolerant([0, 3, 3, 7])).toBe(true);
  });

  it("returns false for decreasing sequences", () => {
    expect(isGapTolerant([5, 3])).toBe(false);
    expect(isGapTolerant([10, 8, 12])).toBe(false);
  });

  it("returns true for empty and single-element sequences", () => {
    expect(isGapTolerant([])).toBe(true);
    expect(isGapTolerant([42])).toBe(true);
  });

  it("property: any non-decreasing sequence is gap-tolerant", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 0, maxLength: 50 }).map((arr) =>
          [...arr].sort((a, b) => a - b),
        ),
        (sorted) => {
          expect(isGapTolerant(sorted)).toBe(true);
        },
      ),
    );
  });
});
