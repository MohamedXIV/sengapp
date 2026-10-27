import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground">
      <main className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-5xl" aria-hidden="true">🐿️</div>
          <h1 className="text-3xl font-bold tracking-tight">Sengapp</h1>
          <p className="text-sm text-muted-foreground">A little place for big conversations.</p>
        </div>
        <p className="rounded-lg border bg-muted/60 p-3 text-sm text-muted-foreground">
          Anyone can join with a verified email address. Your space starts private,
          even without friends. Connect only when you choose.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/login" className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
            Sign in or join
          </Link>
          <Link href="/invite" className="text-sm text-primary underline">
            Have a connection invitation?
          </Link>
        </div>
      </main>
    </div>
  );
}
