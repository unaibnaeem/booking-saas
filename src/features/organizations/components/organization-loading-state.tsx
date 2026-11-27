type OrganizationLoadingStateProps = {
  label?: string;
};

export function OrganizationLoadingState({
  label = "Loading your organizations...",
}: OrganizationLoadingStateProps) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className="border-border bg-surface rounded-2xl border p-5 shadow-sm sm:p-7"
    >
      <div className="mb-5 space-y-3">
        <div className="bg-surface-muted h-5 w-48 max-w-full animate-pulse rounded-md" />
        <div className="bg-surface-muted h-3 w-64 max-w-full animate-pulse rounded-md" />
      </div>

      <div className="space-y-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="border-border flex items-center gap-3 rounded-xl border p-4"
            aria-hidden="true"
          >
            <div className="bg-surface-muted size-11 shrink-0 animate-pulse rounded-xl" />

            <div className="min-w-0 flex-1 space-y-2">
              <div className="bg-surface-muted h-4 w-36 max-w-full animate-pulse rounded-md" />
              <div className="bg-surface-muted h-3 w-28 max-w-full animate-pulse rounded-md" />
            </div>

            <div className="bg-surface-muted h-4 w-12 animate-pulse rounded-md" />
          </div>
        ))}
      </div>

      <span className="sr-only">{label}</span>
    </div>
  );
}
