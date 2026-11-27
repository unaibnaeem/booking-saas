type ButtonSpinnerProps = {
  label: string;
  className?: string;
};

export function ButtonSpinner({ label, className = "" }: ButtonSpinnerProps) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-2 ${className}`}
      role="status"
    >
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
      />
      <span>{label}</span>
    </span>
  );
}
