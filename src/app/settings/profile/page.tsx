"use client";
import { MemberGate } from "@/components/access/member-gate";
import { ProfileEditor } from "@/features/profile/profile-editor";

export default function ProfilePage() {
  return <MemberGate>{profile => <ProfileEditor key={profile._id} profile={profile} />}</MemberGate>;
}
