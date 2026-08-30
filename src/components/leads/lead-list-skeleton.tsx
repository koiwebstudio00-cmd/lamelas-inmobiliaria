import { Skeleton } from "@/components/ui/skeleton";

const ROWS = Array.from({ length: 7 }, (_, index) => index);

export function LeadListSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-72 max-w-[70vw]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="size-8" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ROWS.slice(0, 3).map((row) => (
          <div key={row} className="space-y-2 border bg-background p-3">
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-24 max-w-full" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Skeleton className="h-9 w-full" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ROWS.slice(0, 4).map((row) => (
            <Skeleton key={row} className="h-9 w-full" />
          ))}
        </div>
      </div>

      <div className="hidden overflow-hidden border bg-background md:block">
        <div className="grid h-11 grid-cols-[1.2fr_1fr_.6fr_1.2fr_.8fr_.8fr_.7fr] items-center gap-4 border-b px-4">
          {ROWS.map((row) => (
            <Skeleton key={row} className="h-3 w-16 max-w-full" />
          ))}
        </div>
        {ROWS.map((row) => (
          <div
            key={row}
            className="grid min-h-16 grid-cols-[1.2fr_1fr_.6fr_1.2fr_.8fr_.8fr_.7fr] items-center gap-4 border-b px-4 last:border-b-0"
          >
            <Skeleton className="h-4 w-28 max-w-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24 max-w-full" />
              <Skeleton className="h-3 w-32 max-w-full" />
            </div>
            <Skeleton className="h-5 w-14 max-w-full" />
            <Skeleton className="h-3 w-32 max-w-full" />
            <Skeleton className="h-3 w-24 max-w-full" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="ml-auto h-3 w-20 max-w-full" />
          </div>
        ))}
      </div>

      <div className="space-y-2 md:hidden">
        {ROWS.slice(0, 5).map((row) => (
          <div key={row} className="space-y-3 border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
