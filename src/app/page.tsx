import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
      <main className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <div className="text-5xl" aria-hidden="true">
            🐿️
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Sengapp</h1>
          <p className="text-muted-foreground text-sm">
            A little place for big conversations.
          </p>
        </div>

        <p className="text-xs text-muted-foreground bg-muted/60 p-3 rounded-lg border border-border">
          Invite only. Sengapp is a private sanctuary for friends and family.
          Membership requires an invitation link from an existing member or operator.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Sign In to Lounge
          </Link>
          <Link href="/invite" className="text-sm text-primary underline">
            Redeem your invitation
          </Link>
        </div>
      </main>
    </div>
  );
}
