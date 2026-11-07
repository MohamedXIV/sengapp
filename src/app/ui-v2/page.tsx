import type { Metadata } from "next";
import { VanillaMessenger } from "@/ui-v2/vanilla/messenger";
import "@/ui-v2/vanilla/shadcn-theme.css";

export const metadata: Metadata = {
  title: "Sengapp UI v2 — shadcn baseline",
  description: "Composed from the official shadcn chat demo and sidebar-08 block.",
};

export default function UiV2Baseline() {
  return <VanillaMessenger />;
}
