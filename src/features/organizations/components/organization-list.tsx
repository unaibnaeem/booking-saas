import { OrganizationCard } from "./organization-card";

import type { OrganizationOption } from "@/features/organizations/types";

type OrganizationListProps = {
  organizations: OrganizationOption[];
  isSelectingId: string | null;
  onSelect: (organizationId: string) => void;
};

export function OrganizationList({
  organizations,
  isSelectingId,
  onSelect,
}: OrganizationListProps) {
  return (
    <div className="space-y-3">
      {organizations.map((organization) => (
        <OrganizationCard
          key={organization.id}
          organization={organization}
          isSelecting={isSelectingId === organization.id}
          disabled={isSelectingId !== null}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
