import type { Metadata } from "next";

import "@fontsource-variable/dm-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookwise | Simple scheduling. Better business.",
  description:
    "Bookwise helps service businesses organize their organizations, services, resources, and bookings.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
