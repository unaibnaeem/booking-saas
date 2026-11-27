import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <Link
          href="/"
          className="mb-10 inline-flex items-center justify-center gap-2.5"
        >
          <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl text-lg font-bold">
            B
          </div>

          <span className="text-foreground text-2xl font-bold tracking-tight">
            bookwise
          </span>
        </Link>

        <div className="border-border bg-surface rounded-2xl border p-8 shadow-sm sm:p-10">
          <div className="bg-accent-soft text-primary mx-auto flex size-16 items-center justify-center rounded-2xl text-2xl font-bold">
            404
          </div>

          <p className="text-accent mt-6 text-xs font-semibold tracking-wider uppercase">
            Page not found
          </p>

          <h1 className="text-foreground mt-2 text-2xl font-semibold tracking-tight">
            Lost your way?
          </h1>

          <p className="text-muted-foreground mt-3 text-sm leading-6">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It
            may have been moved, deleted, or the address might be incorrect.
          </p>

          <Link
            href="/"
            className="bg-primary text-primary-foreground hover:bg-primary-hover mt-7 flex h-11 w-full items-center justify-center rounded-lg px-5 text-sm font-semibold transition-colors"
          >
            Back to home
          </Link>
        </div>

        <p className="text-muted-foreground mt-6 text-xs">
          © Bookwise. All rights reserved.
        </p>
      </div>
    </main>
  );
}
