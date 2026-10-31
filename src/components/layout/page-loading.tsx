import { Skeleton } from "@/components/ui/skeleton";

export function PageLoading({ kind = "page" }: { kind?: "page" | "list" | "chat" }) {
  return <main role="status" aria-label="Loading Sengapp" className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-8">
    <span className="sr-only">Loading</span>
    <div className="flex items-center gap-4">
      <Skeleton className="size-12 shrink-0 rounded-2xl" />
      <div className="flex-1 space-y-2"><Skeleton className="h-6 w-44 max-w-full rounded-lg" /><Skeleton className="h-3 w-60 max-w-full rounded-lg" /></div>
    </div>
    <div className="space-y-4 rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-7">
      {kind === "chat" ? <>
        <div className="space-y-5 py-5">
          <Skeleton className="ms-auto h-12 w-1/2 max-w-full rounded-2xl" />
          <Skeleton className="h-20 w-3/5 max-w-full rounded-2xl" />
          <Skeleton className="ms-auto h-16 w-2/5 max-w-full rounded-2xl" />
          <Skeleton className="h-12 w-1/2 max-w-full rounded-2xl" />
        </div>
        <Skeleton className="mt-6 h-12 w-full rounded-xl" />
      </> : kind === "list" ? Array.from({ length: 5 }, (_, i) =>
        <div key={i} className="flex items-center gap-4 py-2"><Skeleton className="size-12 shrink-0 rounded-2xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-40 max-w-full" /><Skeleton className="h-3 w-24 max-w-full" /></div></div>
      ) : <>
        <Skeleton className="h-20 w-3/4 max-w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-44 rounded-2xl" /><Skeleton className="h-44 rounded-2xl" /></div>
      </>}
    </div>
  </main>;
}
