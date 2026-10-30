import type { MutationCtx } from "../_generated/server";

// A readable stem plus truncated SHA-256. Never disclose raw email or Clerk ID.
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

async function publicSuffix(subject: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(subject));
  return Array.from(new Uint8Array(digest).slice(0, 5), byte => byte.toString(16).padStart(2, "0")).join("");
}

// Convex OCC serializes competing claims: checking indexed availability and
// inserting/updating the handle happen in the same mutation transaction.
export async function allocateHandle(db: MutationCtx["db"], subject: string, nameOrEmail: string): Promise<string> {
  const base = `${handleStem(nameOrEmail)}_${await publicSuffix(subject)}`;
  for (let attempt = 0; attempt < 1000; attempt++) {
    const candidate = attempt ? `${base.slice(0, 24 - String(attempt).length - 1)}_${attempt}` : base;
    const taken = await db.query("profiles").withIndex("by_handle", q => q.eq("handle", candidate)).unique();
    if (!taken) return candidate;
  }
  throw new Error("Unable to allocate a unique handle");
}

export function fallbackDisplayName(verifiedEmail: string): string {
  const local = verifiedEmail.split("@")[0] ?? "";
  const name = local.replace(/[._-]+/g, " ").trim().replace(/\s+/g, " ");
  return name ? name.slice(0, 50) : "New member";
}
