"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({
  id,
  className,
  disabled,
  value,
  onChange,
  ...props
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const [isVisible, setIsVisible] = useState(false);

  const hasValue = Boolean(value);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.value) {
      setIsVisible(false);
    }

    onChange?.(event);
  }

  return (
    <div className="relative">
      <input
        {...props}
        id={inputId}
        value={value}
        onChange={handleChange}
        type={isVisible && hasValue ? "text" : "password"}
        disabled={disabled}
        className={`border-border bg-surface text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:ring-primary/10 h-11 w-full rounded-lg border px-3.5 pr-11 text-sm transition outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""} `}
      />

      {hasValue && (
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          disabled={disabled}
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          aria-controls={inputId}
          className="text-muted-foreground hover:text-foreground focus-visible:outline-primary absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-lg transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isVisible ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
              aria-hidden="true"
            >
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 002.8 2.8" />
              <path d="M9.9 5.2A10.8 10.8 0 0112 5c6 0 9.5 7 9.5 7a16.5 16.5 0 01-2.4 3.2" />
              <path d="M6.6 6.6C3.9 8.4 2.5 12 2.5 12s3.5 7 9.5 7a10 10 0 004.7-1.2" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
              aria-hidden="true"
            >
              <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
