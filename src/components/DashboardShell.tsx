import type { Session } from "next-auth";
import { AppHeader } from "@/components/AppHeader";
import { NavLink } from "@/components/NavLink";

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
  const allHrefs = [...nav, ...(navEnd ?? [])].map((item) => item.href);

  const navLinks = nav.map((item) => (
    <NavLink
      key={item.href}
      href={item.href}
      label={item.label}
      allHrefs={allHrefs}
    />
  ));

  const navEndLinks = (navEnd ?? []).map((item) => (
    <NavLink
      key={item.href}
      href={item.href}
      label={item.label}
      allHrefs={allHrefs}
    />
  ));

  return (
    <div className="min-h-screen bg-cream">
      <AppHeader session={session} nav={navLinks} navEnd={navEndLinks} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
