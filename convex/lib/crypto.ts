/**
 * Cryptographic helpers compatible with Convex standard V8 runtime
 * and Node.js 20+ Web Crypto API.
 */

export function generateSecureInvitationToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function hashInvitationToken(rawToken: string): Promise<string> {
  const normalized = rawToken.trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const digestBuffer = await crypto.subtle.digest("SHA-256", data);
  const digestArray = Array.from(new Uint8Array(digestBuffer));
  return digestArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function createTokenHint(rawToken: string): string {
  const clean = rawToken.trim();
  return clean.length === 43 ? `${clean.slice(0, 4)}…${clean.slice(-4)}` : "invalid";
}
