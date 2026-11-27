"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    label: "Overview",
    href: "/dashboard",
  },
  {
    label: "Bookings",
    href: "/bookings",
  },
];

export function WorkspaceNavigation() {
  const pathname = usePathname();

  const isWorkspacePage =
    pathname === "/dashboard" || pathname.startsWith("/bookings");

  if (!isWorkspacePage) {
    return null;
  }

  return (
    <div className="border-border bg-surface border-b">
      <nav
        aria-label="Workspace navigation"
        className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2 sm:px-6 lg:px-8"
      >
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith("/bookings");

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`focus-visible:outline-primary rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                isActive
                  ? "bg-accent-soft text-primary"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              } `}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
