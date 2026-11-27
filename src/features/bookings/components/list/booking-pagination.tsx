import type { Pagination } from "@/features/bookings/types";

type BookingPaginationProps = {
  pagination: Pagination;
  page: number;
  isLoading: boolean;
  onPageChange: (nextPage: number) => void;
};

export function BookingPagination({
  pagination,
  page,
  isLoading,
  onPageChange,
}: BookingPaginationProps) {
  return (
    <div className="border-border mt-6 flex flex-col justify-between gap-4 border-t pt-5 sm:flex-row sm:items-center">
      <p className="text-muted-foreground text-sm">
        Showing page {pagination.page} of {Math.max(pagination.totalPages, 1)}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          className="border-border bg-surface text-foreground hover:bg-surface-muted h-10 cursor-pointer rounded-lg border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pagination.totalPages || isLoading}
          className="border-border bg-surface text-foreground hover:bg-surface-muted h-10 cursor-pointer rounded-lg border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
