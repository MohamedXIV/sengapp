/** Browser-tab-scoped ID. Never stored in localStorage: multiple tabs are independent. */
let currentId: string | null = null;
export function activePresenceSessionId(): string {
  if (!currentId) currentId = crypto.randomUUID();
  return currentId;
}
export function existingPresenceSessionId(): string | null {
  return currentId;
}

/** Local expiry helpers. No query polling or repeated backend subscriptions. */
export function isPeerOnline(until: number | null | undefined, now: number): boolean {
  return typeof until === "number" && until > now;
}
export function nextSignalExpiry(
  until: number | null | undefined,
  typing: { expiresAt: number }[] | undefined,
  now: number,
): number | null {
  const upcoming = [until ?? 0, ...(typing ?? []).map(x => x.expiresAt)]
    .filter(value => value > now);
  return upcoming.length ? Math.min(...upcoming) : null;
}
