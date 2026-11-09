import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import type { AppLocale } from "@/lib/i18n/locale";
import { VanillaMessenger } from "@/ui-v2/vanilla/messenger";
import "dockview-react/dist/styles/dockview.css";
import "@/ui-v2/vanilla/shadcn-theme.css";

export const metadata: Metadata = {
  title: "Sengapp — Classic & Cozy UI",
  description: "Shared shadcn messaging components in Classic and Dockview + Phaser Cozy shells.",
};

export default async function UiV2Baseline() {
  const locale = (await getLocale()) as AppLocale;
  return <VanillaMessenger initialLocale={locale} />;
}
