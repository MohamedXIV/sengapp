import { describe, expect, it } from "vitest";
import { isPeerOnline, nextSignalExpiry } from "../../src/lib/presence/session";

describe("locally calculated live presence", () => {
  it("can turn online to offline at the exact lease deadline without a new Convex query", () => {
    expect(isPeerOnline(70_000, 69_999)).toBe(true);
    expect(isPeerOnline(70_000, 70_000)).toBe(false);
    expect(isPeerOnline(0, 1)).toBe(false);
    expect(isPeerOnline(null, 1)).toBe(false);
  });

  it("calculates one local timeout for the next online or typing expiry", () => {
    const typing = [{ expiresAt: 7_000 }, { expiresAt: 8_000 }];
    expect(nextSignalExpiry(70_000, typing, 6_500)).toBe(7_000);
    expect(nextSignalExpiry(70_000, typing, 7_000)).toBe(8_000);
    expect(nextSignalExpiry(70_000, typing, 9_000)).toBe(70_000);
    expect(nextSignalExpiry(70_000, typing, 70_000)).toBeNull();
    expect(nextSignalExpiry(null, [], 10)).toBeNull();
  });
});
