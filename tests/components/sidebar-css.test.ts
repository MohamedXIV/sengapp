import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import { describe, expect, it } from "vitest";

describe("Shadcn sidebar styles on Tailwind 4", () => {
  it("compiles an actual sidebar width so offcanvas displacement hides the whole panel", async () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
    const compiled = await postcss([tailwindcss()]).process(source, {
      from: resolve(process.cwd(), "src/app/globals.css"),
    });
    expect(compiled.css).toContain("width: var(--sidebar-width);");
    expect(compiled.css).toContain("width: var(--sidebar-width-icon);");
    expect(compiled.css).not.toContain("width: --sidebar-width;");
    expect(compiled.css).not.toContain("width: --sidebar-width-icon;");
  });
});
