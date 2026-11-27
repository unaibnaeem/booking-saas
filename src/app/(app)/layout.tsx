import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GeistMono } from "geist/font/mono";

import { Toaster } from "sonner";

import { auth } from "@/lib/auth";
import { AppHeader } from "./_components/app-header";
import { WorkspaceNavigation } from "./_components/workspace-navigation";

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className={`${GeistMono.variable} contents`}>
      <Toaster position="top-right" richColors closeButton duration={4000} />

      <AppHeader />

      <WorkspaceNavigation />

      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}
