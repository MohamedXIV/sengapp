import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));

test("framework versions use the approved modern baseline", () => {
  assert.match(packageJson.dependencies.next, /^\^?16\./);
  assert.match(packageJson.dependencies.react, /^\^?19\.3\./);
  assert.match(packageJson.dependencies["react-dom"], /^\^?19\.3\./);
  assert.match(packageJson.devDependencies.tailwindcss, /^\^?4\./);
  assert.ok(packageJson.devDependencies["@tailwindcss/postcss"]);
});

test("Next 16 uses a single Clerk-aware proxy file", () => {
  assert.ok(existsSync(new URL("../../src/proxy.ts", import.meta.url)));
  assert.equal(existsSync(new URL("../../src/middleware.ts", import.meta.url)), false);
  const source = readFileSync(new URL("../../src/proxy.ts", import.meta.url), "utf8");
  assert.match(source, /clerkMiddleware/);
  assert.match(source, /__clerk/);
});

test("Tailwind 4 uses its dedicated PostCSS plugin", () => {
  const postcss = readFileSync(new URL("../../postcss.config.mjs", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8");
  assert.match(postcss, /@tailwindcss\/postcss/);
  assert.match(css, /@import\s+["']tailwindcss["']/);
});

test("production TypeScript config excludes Vite test-only type dependencies", () => {
  const tsconfig = JSON.parse(readFileSync(new URL("../../tsconfig.json", import.meta.url), "utf8"));
  assert.equal((tsconfig.compilerOptions.types ?? []).includes("vite/client"), false);
  assert.ok(!tsconfig.include.some((glob) => glob.startsWith("tests/")));
  const testConfig = JSON.parse(readFileSync(new URL("../../tsconfig.test.json", import.meta.url), "utf8"));
  assert.ok(testConfig.compilerOptions.types.includes("vite/client"));
  assert.match(packageJson.scripts.typecheck, /tsconfig\.test\.json/);
});

test("Convex deployment has explicit Node types and a dedicated compiler gate", () => {
  const convexConfig = JSON.parse(readFileSync(new URL("../../convex/tsconfig.json", import.meta.url), "utf8"));
  assert.ok(convexConfig.compilerOptions.types.includes("node"));
  assert.match(packageJson.scripts.typecheck, /convex\/tsconfig\.json/);
});
