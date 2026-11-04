"use client";
import { MemberGate } from "@/components/access/member-gate";
import { AppearanceEditor } from "@/features/profile/appearance-editor";

export default function AppearancePage() {
  return <MemberGate>{profile => <AppearanceEditor key={profile._id} profile={profile} />}</MemberGate>;
}
