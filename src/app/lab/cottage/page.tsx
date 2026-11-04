import { redirect } from "next/navigation";
const VALID_PANELS = new Set(["chats", "connections", "profile", "appearance", "style", "notes", "focus"]);
export default async function LegacyCottage({ searchParams }: {
  searchParams: Promise<{ panel?: string | string[] }>;
}) {
  const { panel } = await searchParams;
  redirect(typeof panel === "string" && VALID_PANELS.has(panel) ? `/?panel=${panel}` : "/");
}
