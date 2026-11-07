import type { Metadata } from "next";
import { VanillaMessenger } from "@/ui-v2/vanilla/messenger";

export const metadata: Metadata = {
  title: "Sengapp UI v2 — shadcn baseline",
  description: "Unmodified shadcn component study using local sample messages.",
};

export default function UiV2Baseline() {
  return <VanillaMessenger />;
}
