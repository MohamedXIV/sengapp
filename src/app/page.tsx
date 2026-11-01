import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EXPERIENCE_COOKIE, preferredExperience } from "@/lib/experience";
import { CottageWorkspace } from "@/features/cottage/cottage-workspace";
import "dockview-react/dist/styles/dockview.css";
import "./lab/cottage/cottage.css";

export const metadata: Metadata = {
  title: "Sengapp — Your cozy space",
  description: "Your private conversations and personal space, together.",
};

export default async function HomePage({ searchParams }: {
  searchParams: Promise<{ panel?: string | string[]; conversation?: string | string[] }>;
}) {
  const params = await searchParams;
  // Explicit Cozy deep links remain stable, while plain home follows this device.
  if (!params.panel && !params.conversation &&
      preferredExperience((await cookies()).get(EXPERIENCE_COOKIE)?.value) === "classic") {
    redirect("/classic");
  }
  return <CottageWorkspace />;
}
