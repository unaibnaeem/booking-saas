type DashboardHeaderProps = {
  userName: string;
};

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <section>
      <p className="text-accent text-xs font-semibold tracking-wider uppercase">
        Workspace overview
      </p>

      <h1 className="text-foreground mt-2 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
        Welcome back, {userName}.
      </h1>

      <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6">
        Manage your organization&apos;s bookings and keep your scheduling
        workflow organized with Bookwise.
      </p>
    </section>
  );
}
