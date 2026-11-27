import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardBookingsCard } from "@/features/dashboard/components/dashboard-bookings-card";
import { DashboardOrganizationCard } from "@/features/dashboard/components/dashboard-organization-card";

export default async function DashboardPage() {
  const requestHeaders = await headers();

  const sessionData = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!sessionData) {
    redirect("/login");
  }

  const activeOrganizationId = sessionData.session.activeOrganizationId;

  if (!activeOrganizationId) {
    const memberships = await prisma.member.findMany({
      where: {
        userId: sessionData.user.id,
      },
      select: {
        organizationId: true,
      },
    });

    if (memberships.length === 0) {
      redirect("/onboarding/organization");
    }

    redirect("/select-organization");
  }

  const [membership, organization] = await Promise.all([
    prisma.member.findFirst({
      where: {
        userId: sessionData.user.id,
        organizationId: activeOrganizationId,
      },
      select: {
        id: true,
      },
    }),

    prisma.organization.findUnique({
      where: {
        id: activeOrganizationId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
  ]);

  if (!membership || !organization) {
    redirect("/select-organization");
  }

  return (
    <div className="bg-background min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <DashboardHeader userName={sessionData.user.name || "there"} />

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <DashboardBookingsCard />

          <DashboardOrganizationCard organization={organization} />
        </section>

        <footer className="text-muted-foreground border-border mt-12 border-t pt-6 text-xs">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {new Date().getFullYear()} Bookwise. All rights reserved.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
