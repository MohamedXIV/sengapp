import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// CI previously ran without Clerk credentials, so the removed components
// survived build and browser tests until a real Preview rendered them.
const obsolete = /\b(?:SignedIn|SignedOut|Protect)\b/;
function* sourceFiles(directory: string): Generator<string> {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(fullPath);
    else if (/\.tsx?$/.test(entry.name)) yield fullPath;
  }
}

describe("Clerk Core 3 compatibility", () => {
  it("does not import removed SignedIn/SignedOut/Protect components", () => {
    const offenders: string[] = [];
    for (const path of sourceFiles("src")) {
      const source = readFileSync(path, "utf8");
      const imports = source.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']@clerk\/nextjs["']/g);
      for (const match of imports) {
        if (obsolete.test(match[1])) offenders.push(path);
      }
    }
    expect(offenders).toEqual([]);
  });
});
