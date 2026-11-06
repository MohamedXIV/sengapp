import type { Metadata } from "next";
import { SengappStudio } from "@/ui-v2/studio/studio";
import "@/ui-v2/studio/studio.css";

export const metadata: Metadata = {
  title: "Sengapp UI v2 — Design studio",
  description: "Isolated design reference. Example conversations only; no live messaging.",
};

/**
 * An intentionally isolated, design-first reference page.
 * Do not import legacy layout, chat components, design tokens or UI wrappers.
 * No backend mutations run on this route.
 */
export default function UiV2DesignPreview() {
  return <SengappStudio />;
}
