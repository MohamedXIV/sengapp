/** shadcn's sidebar_state cookie is device-local layout, never personal data.
 * Unknown/malformed values return null so the icon-first default is safe. */
export function readSidebarState(cookie: string): boolean | null {
  const entry = cookie.split(";").map(part => part.trim())
    .find(part => part.startsWith("sidebar_state="));
  if (!entry) return null;
  const value = entry.slice("sidebar_state=".length);
  return value === "true" ? true : value === "false" ? false : null;
}
