import Link from "next/link";

export function DashboardBookingsCard() {
  return (
    <section className="border-border bg-surface relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 sm:p-8">
      <div className="bg-accent-soft text-primary flex size-12 items-center justify-center rounded-xl text-lg font-bold">
        B
      </div>

      <p className="text-accent mt-6 text-xs font-semibold tracking-wider uppercase">
        Scheduling
      </p>

      <h2 className="text-foreground mt-2 text-xl font-semibold">
        Manage bookings
      </h2>

      <p className="text-muted-foreground mt-2 max-w-lg text-sm leading-6">
        View and manage your appointments, keep track of upcoming bookings, and
        organize your organization&apos;s schedule.
      </p>

      <div className="mt-auto flex flex-col gap-3 pt-7 sm:flex-row">
        <Link
          href="/bookings"
          className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold transition-colors"
        >
          Open bookings
          <span className="ml-2" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
