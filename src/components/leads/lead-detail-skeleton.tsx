import { Skeleton } from "@/components/ui/skeleton";

const LINES = Array.from({ length: 5 }, (_, index) => index);

export function LeadDetailSkeleton() {
  return (
    <div
      className="space-y-4 lg:flex lg:h-[calc(100dvh-6.5rem)] lg:flex-col"
      aria-hidden="true"
    >
      <div className="space-y-4 lg:shrink-0">
        <Skeleton className="h-8 w-20" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 max-w-[70vw]" />
          <Skeleton className="h-4 w-72 max-w-[80vw]" />
        </div>
      </div>

      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 border bg-background lg:flex lg:min-h-0 lg:flex-col">
          <div className="flex h-14 items-center justify-between border-b bg-muted/40 px-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="min-h-[55vh] space-y-5 p-4 lg:min-h-0 lg:flex-1">
            {LINES.map((line) => (
              <div
                key={line}
                className={line % 2 === 0 ? "mr-auto w-3/5" : "ml-auto w-2/3"}
              >
                <Skeleton className="h-14 w-full" />
                <Skeleton className="mt-1.5 h-3 w-24" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 lg:min-h-0 lg:overflow-hidden">
          <div className="border bg-background">
            <div className="flex h-14 items-center justify-between border-b bg-muted/40 px-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-16" />
            </div>
            <div className="space-y-4 p-4">
              {LINES.slice(0, 4).map((line) => (
                <div key={line} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="border bg-background">
            <div className="border-b bg-muted/40 p-4">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-3 p-4">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>

          <div className="border bg-background">
            <div className="border-b bg-muted/40 p-4">
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="space-y-3 p-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
