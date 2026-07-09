"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { Logo } from "./Logo";
import { ROLE_LABELS } from "@/lib/constants";

export function AppHeader({
  session: initialSession,
  nav,
}: {
  session?: Session;
  nav?: React.ReactNode;
}) {
  const { data: clientSession } = useSession();
  const session = clientSession ?? initialSession;
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex min-h-14 items-center justify-between gap-4 py-2">
          <Logo size="sm" />

          {session?.user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right leading-tight">
                <p className="text-sm font-medium text-stone-900 truncate max-w-[9rem] sm:max-w-none">
                  {session.user.name}
                </p>
                <p className="text-xs text-stone-500 hidden sm:block">
                  {ROLE_LABELS[session.user.role]}
                  {session.user.organizationName &&
                    ` · ${session.user.organizationName}`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="shrink-0 rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-60"
              >
                {signingOut ? "…" : "Salir"}
              </button>
            </div>
          ) : (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-stone-100" />
          )}
        </div>

        {nav && (
          <nav className="-mx-4 flex gap-0 overflow-x-auto border-t border-stone-100 px-4">
            {nav}
          </nav>
        )}
      </div>
    </header>
  );
}
