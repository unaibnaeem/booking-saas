import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

const features = [
  {
    number: "01",
    title: "Your organization",
    description: "Create a dedicated workspace for your business and team.",
  },
  {
    number: "02",
    title: "Your services",
    description: "Structure your services, staff, and bookable resources.",
  },
  {
    number: "03",
    title: "Your bookings",
    description: "Build an organized scheduling workflow for your customers.",
  },
];

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="bg-background text-foreground min-h-screen">
      <header className="border-border bg-surface/90 border-b backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl text-lg font-bold">
              B
            </div>

            <span className="text-foreground text-xl font-bold tracking-tight">
              bookwise
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-65px)] max-w-7xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
        <div className="border-border bg-surface text-muted-foreground mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium">
          <span className="bg-success size-2 rounded-full" />
          Scheduling made simpler
        </div>

        <h1 className="text-foreground max-w-4xl text-4xl leading-tight font-semibold tracking-tight sm:text-6xl sm:leading-[1.12]">
          Spend less time managing schedules.
          <span className="text-accent mt-2 block">
            Focus more on your business.
          </span>
        </h1>

        <p className="text-muted-foreground mt-7 max-w-2xl text-base leading-8 sm:text-lg">
          Bookwise is a scheduling platform designed to help service businesses
          organize their teams, services, and appointments in one place.
        </p>

        <div className="mt-10 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/register"
            className="bg-primary text-primary-foreground hover:bg-primary-hover flex h-12 items-center justify-center rounded-lg px-7 text-sm font-semibold transition-colors"
          >
            Create your account
            <span className="ml-2" aria-hidden="true">
              →
            </span>
          </Link>

          <Link
            href="/login"
            className="border-border bg-surface text-foreground hover:bg-surface-muted flex h-12 items-center justify-center rounded-lg border px-7 text-sm font-medium transition-colors"
          >
            Sign in to Bookwise
          </Link>
        </div>

        <div className="mt-24 grid w-full max-w-4xl gap-5 text-left sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.number}
              className="border-border bg-surface hover:border-sage rounded-2xl border p-6 transition-colors"
            >
              <span className="text-accent text-xs font-semibold tracking-wider">
                {feature.number}
              </span>

              <h2 className="text-foreground mt-5 text-base font-semibold">
                {feature.title}
              </h2>

              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <footer className="text-muted-foreground mt-20 text-xs">
          © {new Date().getFullYear()} Bookwise. All rights reserved.
        </footer>
      </section>
    </main>
  );
}
