"use client";

import Link from "next/link";
import { MemberGate } from "@/components/access/member-gate";

export default function OperatorToolsPage() {
  return <MemberGate operatorOnly>{() => <div className="space-y-4">
    <h1 className="text-2xl font-semibold">Operator tools</h1>
    <p className="text-sm text-muted-foreground">
      Account roles are controlled by the verified server-side allowlist.
      Member signup never grants operator privileges.
    </p>
    <p className="text-sm text-muted-foreground">
      Connection invitations now belong to each member, not the operator.
    </p>
    <Link className="text-primary underline" href="/connections">Go to Connections</Link>
  </div>}</MemberGate>;
}
