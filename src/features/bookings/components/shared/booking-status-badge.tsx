import { BOOKING_STATUS_STYLES } from "@/features/bookings/constants";
import type { BookingStatus } from "@/features/bookings/types";

type BookingStatusBadgeProps = {
  status: BookingStatus;
};

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const label = status.replace("_", " ");

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${BOOKING_STATUS_STYLES[status]}`}
    >
      {label}
    </span>
  );
}
