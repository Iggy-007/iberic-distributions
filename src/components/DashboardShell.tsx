import type { Session } from "next-auth";
import { AppHeader } from "@/components/AppHeader";

export function DashboardShell({
  children,
  nav,
  navEnd,
  session,
}: {
  children: React.ReactNode;
  nav: { href: string; label: string }[];
  navEnd?: { href: string; label: string }[];
  session: Session;
}) {
  return (
    <div className="min-h-screen bg-cream">
      <AppHeader session={session} nav={nav} navEnd={navEnd} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
