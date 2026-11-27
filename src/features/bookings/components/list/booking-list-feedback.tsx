type BookingListFeedbackProps = {
  errorMessage: string | null;
  onRetry: () => void;
};

export function BookingListFeedback({
  errorMessage,
  onRetry,
}: BookingListFeedbackProps) {
  if (errorMessage) {
    return (
      <div className="border-danger/20 bg-danger/5 rounded-2xl border p-6 text-center">
        <p className="text-danger text-sm font-medium">
          Unable to load bookings
        </p>

        <p className="text-muted-foreground mt-2 text-sm">{errorMessage}</p>

        <button
          type="button"
          onClick={onRetry}
          className="bg-primary text-primary-foreground hover:bg-primary-hover mt-5 h-10 cursor-pointer rounded-lg px-5 text-sm font-semibold transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return null;
}
