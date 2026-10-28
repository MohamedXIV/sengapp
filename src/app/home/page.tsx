"use client";

import { MemberGate } from "@/components/access/member-gate";
import { CozyHome } from "@/components/home/cozy-home";

export default function MemberHomePage() {
  return (
    <MemberGate>
      {(profile) => <CozyHome name={profile.displayName} operator={profile.role === "operator"} />}
    </MemberGate>
  );
}

