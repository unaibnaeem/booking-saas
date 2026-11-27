export function BookingEmptyState() {
  return (
    <div className="border-border bg-surface rounded-2xl border px-5 py-16 text-center">
      <div className="bg-accent-soft text-primary mx-auto flex size-12 items-center justify-center rounded-xl text-xl font-semibold">
        B
      </div>

      <h2 className="text-foreground mt-5 text-lg font-semibold">
        No bookings found
      </h2>

      <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm leading-6">
        There are no bookings matching your selected filters. Try changing your
        filters to see more results.
      </p>
    </div>
  );
}
