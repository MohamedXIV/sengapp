import type { Metadata } from "next";
import { CottageWorkspace } from "@/features/cottage/cottage-workspace";
import "dockview-react/dist/styles/dockview.css";
import "./cottage.css";
export const metadata: Metadata = { title: "Cottage Lab | Sengapp", description: "Isometric room and floating workspace experiment" };
export default function CottagePage() { return <CottageWorkspace />; }
