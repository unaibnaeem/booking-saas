type DashboardOrganizationCardProps = {
  organization: {
    name: string;
    slug: string;
  };
};

export function DashboardOrganizationCard({
  organization,
}: DashboardOrganizationCardProps) {
  return (
    <section className="border-border bg-surface flex h-full flex-col rounded-2xl border p-6 sm:p-8">
      <div>
        <p className="text-accent text-xs font-semibold tracking-wider uppercase">
          Active organization
        </p>

        <div className="bg-accent-soft text-primary mt-5 flex size-12 items-center justify-center rounded-xl text-xl font-semibold">
          {organization.name.charAt(0).toUpperCase()}
        </div>

        <h2 className="text-foreground mt-4 text-lg font-semibold wrap-break-word">
          {organization.name}
        </h2>

        <p className="text-muted-foreground mt-1 text-sm break-all">
          bookwise/{organization.slug}
        </p>
      </div>

      <div className="border-border mt-auto border-t pt-4">
        <p className="text-success text-xs font-medium">Active workspace</p>
      </div>

      {/* Switch workspace will be enabled when multiple organization management is implemented. */}

      {/*
      <div className="border-border mt-4 border-t pt-4">
        <Link href="/select-organization">
          Switch workspace
        </Link>
      </div>
      */}
    </section>
  );
}
