function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-surface-muted animate-pulse rounded-md ${className}`}
    />
  );
}

export function NewBookingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading booking form"
      aria-busy="true"
      className="border-border bg-surface mt-7 overflow-hidden rounded-2xl border"
    >
      <div className="border-border space-y-3 border-b px-5 py-5 sm:px-7 sm:py-6">
        <SkeletonLine className="h-5 w-48" />
        <SkeletonLine className="h-3 w-64 max-w-full" />
      </div>

      <div className="space-y-7 p-5 sm:p-7">
        <section>
          <div className="mb-4 space-y-2">
            <SkeletonLine className="h-4 w-20" />
            <SkeletonLine className="h-3 w-56 max-w-full" />
          </div>

          <SkeletonLine className="mb-2 h-4 w-24" />
          <SkeletonLine className="h-11 w-full rounded-lg" />
        </section>

        <section className="border-border border-t pt-7">
          <div className="mb-4 space-y-2">
            <SkeletonLine className="h-4 w-16" />
            <SkeletonLine className="h-3 w-64 max-w-full" />
          </div>

          <SkeletonLine className="mb-2 h-4 w-28" />
          <SkeletonLine className="h-11 w-full rounded-lg" />

          <div className="border-border bg-surface-muted mt-4 grid grid-cols-2 gap-4 rounded-xl border p-4 sm:p-5">
            <div className="space-y-3">
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="h-4 w-20" />
            </div>

            <div className="space-y-3">
              <SkeletonLine className="h-3 w-20" />
              <SkeletonLine className="h-5 w-28 max-w-full" />
            </div>
          </div>
        </section>

        <section className="border-border border-t pt-7">
          <div className="mb-4 space-y-2">
            <SkeletonLine className="h-4 w-40" />
            <SkeletonLine className="h-3 w-60 max-w-full" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <SkeletonLine className="h-4 w-24" />
              <SkeletonLine className="h-11 w-full rounded-lg" />
            </div>

            <div className="min-w-0 space-y-2">
              <SkeletonLine className="h-4 w-20" />
              <SkeletonLine className="h-11 w-full rounded-lg" />
            </div>
          </div>

          <div className="border-border bg-surface-muted mt-4 rounded-lg border px-4 py-3">
            <SkeletonLine className="h-3 w-64 max-w-full" />
          </div>
        </section>
      </div>

      <div className="border-border bg-surface-muted/40 flex flex-col-reverse gap-3 border-t p-5 sm:flex-row sm:justify-end sm:px-7 sm:py-5">
        <SkeletonLine className="h-11 w-full rounded-lg sm:w-24" />
        <SkeletonLine className="h-11 w-full rounded-lg sm:w-36" />
      </div>

      <span className="sr-only">Loading booking form...</span>
    </div>
  );
}
