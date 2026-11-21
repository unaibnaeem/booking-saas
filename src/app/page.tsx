import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f5f7f6] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
              B
            </div>

            <span className="text-xl font-semibold tracking-tight">
              bookwise
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-65px)] max-w-7xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
          <span className="size-2 rounded-full bg-emerald-500" />
          Scheduling made simpler
        </div>

        <h1 className="max-w-4xl text-4xl leading-tight font-semibold tracking-tight text-slate-950 sm:text-6xl sm:leading-[1.12]">
          Spend less time managing schedules.
          <span className="mt-2 block text-slate-500">
            Focus more on your business.
          </span>
        </h1>

        <p className="mt-7 max-w-2xl text-base leading-8 text-slate-500 sm:text-lg">
          Bookwise is a scheduling platform designed to help service businesses
          organize their teams, services, and appointments in one place.
        </p>

        <div className="mt-10 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/register"
            className="flex h-12 items-center justify-center rounded-lg bg-slate-900 px-7 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            Create your account
            <span className="ml-2" aria-hidden="true">
              →
            </span>
          </Link>

          <Link
            href="/login"
            className="flex h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-7 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Sign in to Bookwise
          </Link>
        </div>

        <div className="mt-24 grid w-full max-w-4xl gap-5 text-left sm:grid-cols-3">
          {[
            {
              number: "01",
              title: "Your organization",
              description:
                "Create a dedicated workspace for your business and team.",
            },
            {
              number: "02",
              title: "Your services",
              description:
                "Structure your services, staff, and bookable resources.",
            },
            {
              number: "03",
              title: "Your bookings",
              description:
                "Build an organized scheduling workflow for your customers.",
            },
          ].map((feature) => (
            <div
              key={feature.number}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="text-xs font-semibold tracking-wider text-slate-400">
                {feature.number}
              </span>

              <h2 className="mt-5 text-base font-semibold text-slate-900">
                {feature.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <footer className="mt-20 text-xs text-slate-400">
          © {new Date().getFullYear()} Bookwise. All rights reserved.
        </footer>
      </section>
    </main>
  );
}
