import Link from "next/link";

export function NewBookingPageHeader() {
  return (
    <header>
      <Link
        href="/bookings"
        className="text-muted-foreground hover:text-primary inline-flex h-9 items-center gap-2 text-sm font-medium transition-colors"
      >
        <span aria-hidden="true">←</span>
        Back to bookings
      </Link>

      <div className="mt-5 sm:mt-7">
        {/* <p className="text-accent text-xs font-semibold tracking-wider uppercase">
          Scheduling
        </p> */}

        <h1 className="text-foreground mt-2 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
          Create a booking
        </h1>

        <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6">
          Schedule a new appointment for one of your customers.
        </p>
      </div>
    </header>
  );
}
