"use client";
import { MemberGate } from "@/components/access/member-gate";
import { ConnectionsSpace } from "@/features/connections/connections-space";
export default function ConnectionsPage() {
  return <MemberGate>{() => <ConnectionsSpace />}</MemberGate>;
}
