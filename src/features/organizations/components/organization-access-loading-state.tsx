type OrganizationAccessLoadingStateProps = {
  label?: string;
};

export function OrganizationAccessLoadingState({
  label = "Checking your account and organizations...",
}: OrganizationAccessLoadingStateProps) {
  return (
    <main
      role="status"
      aria-busy="true"
      className="bg-background flex min-h-screen items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex items-center justify-center gap-2.5">
            <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl text-lg font-bold">
              B
            </div>

            <span className="text-foreground text-2xl font-bold tracking-tight">
              bookwise
            </span>
          </div>

          <p className="text-muted-foreground text-sm">
            Simple scheduling. Better business.
          </p>
        </div>

        <div className="border-border bg-surface rounded-2xl border p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="bg-surface-muted size-10 shrink-0 animate-pulse rounded-xl" />

            <div className="min-w-0 flex-1 space-y-2">
              <div className="bg-surface-muted h-4 w-36 max-w-full animate-pulse rounded" />
              <div className="bg-surface-muted h-3 w-48 max-w-full animate-pulse rounded" />
            </div>
          </div>

          <div className="border-border mt-6 border-t pt-5">
            <p className="text-muted-foreground text-center text-sm">{label}</p>

            <div className="bg-surface-muted mx-auto mt-4 h-1.5 w-32 animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
