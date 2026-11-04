"use client";

import { MemberGate } from "@/components/access/member-gate";
import { CozyHome } from "@/components/home/cozy-home";

/** Permanent lightweight messenger entry: no Phaser or Dockview imports. */
export default function ClassicHomePage() {
  return <MemberGate>{profile =>
    <CozyHome name={profile.displayName} operator={profile.role === "operator"} />
  }</MemberGate>;
}
