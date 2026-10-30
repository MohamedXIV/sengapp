import type { MutationCtx } from "../_generated/server";

// A readable stem plus a non-reversible suffix. Never disclose raw email or Clerk ID.
export function handleStem(input: string): string {
  const basis = input.includes("@") ? input.split("@")[0] : input;
  const stem = (basis ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return (stem.slice(0, 14) || "friend").replace(/_+$/g, "");
}

export function providerDisplayName(signedName?: string, clerkHint?: string): string | undefined {
  const value = [signedName, clerkHint].find(v => typeof v === "string" && v.trim().length > 0);
  return value?.trim().replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 50).trim() || undefined;
}

function publicSuffix(subject: string): string {
  let hash = 2166136261;
  for (const char of subject) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(6, "0");
}

// Convex OCC serializes competing claims: checking indexed availability and
// inserting/updating the handle happen in the same mutation transaction.
export async function allocateHandle(db: MutationCtx["db"], subject: string, nameOrEmail: string): Promise<string> {
  const base = `${handleStem(nameOrEmail)}_${publicSuffix(subject)}`;
  for (let attempt = 0; attempt < 1000; attempt++) {
    const candidate = attempt ? `${base.slice(0, 24 - String(attempt).length - 1)}_${attempt}` : base;
    const taken = await db.query("profiles").withIndex("by_handle", q => q.eq("handle", candidate)).unique();
    if (!taken) return candidate;
  }
  throw new Error("Unable to allocate a unique handle");
}
