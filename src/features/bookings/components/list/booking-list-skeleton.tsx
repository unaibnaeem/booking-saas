type BookingListSkeletonProps = {
  showGroupHeading?: boolean;
};

export function BookingListSkeleton({
  showGroupHeading = false,
}: BookingListSkeletonProps) {
  return (
    <section
      aria-label="Loading bookings"
      aria-busy="true"
      className="space-y-8"
    >
      <div className="space-y-3">
        {showGroupHeading && (
          <div className="flex items-center gap-3">
            <div className="bg-surface-muted h-5 w-24 animate-pulse rounded" />
            <div className="bg-surface-muted h-4 w-6 animate-pulse rounded" />
          </div>
        )}

        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              aria-hidden="true"
              className="border-border bg-surface rounded-2xl border p-5"
            >
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-surface-muted h-5 w-36 animate-pulse rounded" />
                    <div className="bg-surface-muted h-6 w-24 animate-pulse rounded-full" />
                  </div>

                  <div className="bg-surface-muted h-3 w-48 max-w-full animate-pulse rounded" />

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-surface-muted h-4 w-32 animate-pulse rounded" />
                    <div className="bg-surface-muted h-4 w-24 animate-pulse rounded" />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
                  <div className="bg-surface-muted h-4 w-36 animate-pulse rounded" />
                  <div className="bg-surface-muted h-5 w-24 animate-pulse rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
