function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-surface-muted animate-pulse rounded-md ${className}`}
    />
  );
}

function InformationCardSkeleton() {
  return (
    <section className="border-border bg-surface min-w-0 rounded-2xl border p-5 sm:p-6">
      <div className="border-border flex items-center gap-3 border-b pb-4">
        <SkeletonLine className="size-10 shrink-0 rounded-xl" />

        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-36 max-w-full" />
          <SkeletonLine className="h-3 w-24" />
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div className="space-y-2">
          <SkeletonLine className="h-3 w-24" />
          <SkeletonLine className="h-4 w-40 max-w-full" />
        </div>

        <div className="space-y-2">
          <SkeletonLine className="h-3 w-28" />
          <SkeletonLine className="h-4 w-48 max-w-full" />
        </div>

        <div className="space-y-2">
          <SkeletonLine className="h-3 w-24" />
          <SkeletonLine className="h-4 w-32 max-w-full" />
        </div>
      </div>
    </section>
  );
}

export function BookingDetailsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading booking details"
      aria-busy="true"
      className="bg-background min-h-[calc(100vh-4rem)]"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <SkeletonLine className="h-4 w-36" />

        <div className="mt-5 flex flex-col gap-5 sm:mt-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <SkeletonLine className="h-3 w-28" />
            <SkeletonLine className="h-9 w-64 max-w-full sm:h-10" />
            <SkeletonLine className="h-3 w-52 max-w-full" />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:flex sm:w-auto">
            <SkeletonLine className="h-11 w-full rounded-lg sm:w-32" />
            <SkeletonLine className="h-11 w-full rounded-lg sm:w-36" />
          </div>
        </div>

        <section className="border-border bg-surface mt-6 overflow-hidden rounded-2xl border sm:mt-7">
          <div className="border-border flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine className="h-3 w-28" />
              <SkeletonLine className="h-5 w-52 max-w-full" />
            </div>

            <SkeletonLine className="h-7 w-24 rounded-full" />
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:gap-6 sm:p-7 lg:grid-cols-3">
            <div className="bg-surface-muted space-y-3 rounded-xl p-4">
              <SkeletonLine className="h-3 w-12" />
              <SkeletonLine className="h-4 w-40 max-w-full" />
            </div>

            <div className="bg-surface-muted space-y-3 rounded-xl p-4">
              <SkeletonLine className="h-3 w-12" />
              <SkeletonLine className="h-4 w-40 max-w-full" />
            </div>

            <div className="border-border space-y-3 rounded-xl border p-4 sm:col-span-2 lg:col-span-1">
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="h-8 w-32" />
              <SkeletonLine className="h-3 w-20" />
            </div>
          </div>

          <div className="border-border border-t px-5 py-3 sm:px-7">
            <SkeletonLine className="h-3 w-64 max-w-full" />
          </div>
        </section>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <InformationCardSkeleton />
          <InformationCardSkeleton />
        </div>

        <section className="border-border bg-surface mt-5 rounded-2xl border p-5 sm:p-6">
          <SkeletonLine className="h-4 w-28" />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <SkeletonLine className="h-3 w-20" />
              <SkeletonLine className="h-4 w-40 max-w-full" />
            </div>

            <div className="space-y-2">
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="h-4 w-40 max-w-full" />
            </div>
          </div>
        </section>
      </div>

      <span className="sr-only">Loading booking information...</span>
    </div>
  );
}
