import { ButtonSpinner } from "@/components/ui/button-spinner";

import type { OrganizationOption } from "@/features/organizations/types";

type OrganizationCardProps = {
  organization: OrganizationOption;
  isSelecting: boolean;
  disabled: boolean;
  onSelect: (organizationId: string) => void;
};

export function OrganizationCard({
  organization,
  isSelecting,
  disabled,
  onSelect,
}: OrganizationCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(organization.id)}
      disabled={disabled}
      aria-label={`Open ${organization.name}`}
      className="border-border hover:border-primary hover:bg-surface-muted focus-visible:outline-primary flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-semibold">
          {organization.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-semibold">
            {organization.name}
          </p>

          <p className="text-muted-foreground mt-1 truncate text-xs">
            bookwise/{organization.slug}
          </p>
        </div>
      </div>

      <span className="text-primary shrink-0 text-sm font-semibold">
        {isSelecting ? <ButtonSpinner label="Opening..." /> : "Open"}
      </span>
    </button>
  );
}
