import type { Metadata } from "next";
import { CottageWorkspace } from "@/features/cottage/cottage-workspace";
import "dockview-react/dist/styles/dockview.css";
import "./lab/cottage/cottage.css";

export const metadata: Metadata = {
  title: "Sengapp — Your cozy space",
  description: "Your private conversations and personal space, together.",
};

export default function HomePage() {
  return <CottageWorkspace />;
}
