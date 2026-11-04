/** A non-sensitive, device-local UI choice. Accounts and conversations never fork. */
export const EXPERIENCE_COOKIE = "sengapp-experience";
export const EXPERIENCE_MAX_AGE = 60 * 60 * 24 * 365;
export type ExperienceMode = "classic" | "cozy";

export function preferredExperience(value: string | undefined): ExperienceMode {
  return value === "classic" ? "classic" : "cozy";
}

const CONVERSATION_ID = /^[a-z0-9]{16,64}$/;

export function validConversationId(id: string | null | undefined): id is string {
  return typeof id === "string" && CONVERSATION_ID.test(id);
}

export function classicDestination(panel?: string | null, conversationId?: string | null): string {
  switch (panel) {
    case "chats":
      return validConversationId(conversationId) ? `/chats/${conversationId}` : "/chats";
    case "connections": return "/connections";
    case "profile": return "/settings/profile";
    case "appearance":
    case "style": return "/settings/appearance";
    default: return "/classic";
  }
}

export function cozyDestination(pathname: string): string {
  if (pathname === "/chats") return "/?panel=chats";
  const thread = /^\/chats\/([^/]+)$/.exec(pathname);
  if (thread) return validConversationId(thread[1])
    ? `/?panel=chats&conversation=${encodeURIComponent(thread[1])}`
    : "/?panel=chats";
  if (pathname === "/connections") return "/?panel=connections";
  if (pathname === "/settings/profile") return "/?panel=profile";
  if (pathname === "/settings/appearance") return "/?panel=appearance";
  return "/";
}
