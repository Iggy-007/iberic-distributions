"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { Logo } from "./Logo";
import { NavLink } from "./NavLink";
import { MobileNav } from "./MobileNav";
import { ROLE_LABELS } from "@/lib/constants";
import { btnSecondary } from "@/lib/ui-classes";

function orgInitial(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  return name.trim().charAt(0).toUpperCase();
}

export function AppHeader({
  session: initialSession,
  nav = [],
  navEnd = [],
}: {
  session?: Session;
  nav?: { href: string; label: string }[];
  navEnd?: { href: string; label: string }[];
}) {
  const { data: clientSession } = useSession();
  const session = clientSession ?? initialSession;
  const [signingOut, setSigningOut] = useState(false);

  const allNav = [...nav, ...navEnd];
  const allHrefs = allNav.map((item) => item.href);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex min-h-14 items-center justify-between gap-3 py-2">
          <Logo size="sm" />

          {session?.user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wine/10 text-sm font-semibold text-wine"
                aria-hidden
              >
                {orgInitial(session.user.organizationName)}
              </div>
              <div className="text-right leading-tight min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate max-w-[10rem] sm:max-w-none">
                  {session.user.name}
                </p>
                <p className="text-xs text-stone-500">
                  <span className="inline-flex rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-medium text-stone-700 sm:bg-transparent sm:p-0 sm:text-xs sm:font-normal sm:text-stone-500">
                    {ROLE_LABELS[session.user.role]}
                  </span>
                  {session.user.organizationName && (
                    <span className="hidden sm:inline">
                      {" "}
                      · {session.user.organizationName}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className={`${btnSecondary} shrink-0 !min-h-0 !py-1.5 !px-3 text-sm`}
              >
                {signingOut ? "…" : "Salir"}
              </button>
            </div>
          ) : (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-stone-100" />
          )}
        </div>

        {allNav.length > 0 && (
          <>
            <nav className="hidden md:flex items-center justify-between gap-4 border-t border-stone-100 -mx-4 px-4">
              <div className="flex gap-0">
                {nav.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    allHrefs={allHrefs}
                  />
                ))}
              </div>
              {navEnd.length > 0 && (
                <div className="ml-auto flex shrink-0 gap-0">
                  {navEnd.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      allHrefs={allHrefs}
                    />
                  ))}
                </div>
              )}
            </nav>
            <MobileNav items={allNav} />
          </>
        )}
      </div>
    </header>
  );
}
