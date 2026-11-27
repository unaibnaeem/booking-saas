export type BookingView = "list" | "calendar";

type BookingViewSwitcherProps = {
  view: BookingView;
  onViewChange: (view: BookingView) => void;
};

export function BookingViewSwitcher({
  view,
  onViewChange,
}: BookingViewSwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Booking view"
      className="border-border bg-surface-muted flex rounded-lg border p-1"
    >
      <button
        type="button"
        onClick={() => onViewChange("list")}
        aria-pressed={view === "list"}
        className={`cursor-pointer rounded-md px-4 py-2 text-xs font-medium transition-colors ${
          view === "list"
            ? "bg-surface text-primary shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        List
      </button>

      <button
        type="button"
        onClick={() => onViewChange("calendar")}
        aria-pressed={view === "calendar"}
        className={`cursor-pointer rounded-md px-4 py-2 text-xs font-medium transition-colors ${
          view === "calendar"
            ? "bg-surface text-primary shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Calendar
      </button>
    </div>
  );
}
