import type { Booking } from "@/features/bookings/types";

import { BookingCard } from "./booking-card";

type BookingListGroup = {
  key: string;
  label: string;
  bookings: Booking[];
};

type BookingListProps = {
  groups: BookingListGroup[];
  timeZone: string;
};

export function BookingList({ groups, timeZone }: BookingListProps) {
  return (
    <section className="space-y-8">
      {groups.map((group) => (
        <div key={group.key} className="space-y-3">
          {group.label && (
            <div className="border-border flex items-center justify-between border-b pb-2">
              <h2 className="text-foreground text-sm font-semibold">
                {group.label}
              </h2>

              <span className="text-muted-foreground text-xs">
                {group.bookings.length}{" "}
                {group.bookings.length === 1 ? "booking" : "bookings"}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {group.bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                timeZone={timeZone}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
