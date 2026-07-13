"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

function isNavActive(pathname: string, href: string, allHrefs: string[]): boolean {
  if (pathname === href) return true;
  if (!pathname.startsWith(href + "/")) return false;

  const hasMoreSpecificMatch = allHrefs.some(
    (other) =>
      other !== href &&
      other.length > href.length &&
      (pathname === other || pathname.startsWith(other + "/"))
  );

  return !hasMoreSpecificMatch;
}

export function MobileNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const allHrefs = items.map((i) => i.href);

  return (
    <div className="md:hidden border-t border-stone-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-stone-700 min-h-[44px]"
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
      >
        <span>Menú</span>
        <span aria-hidden className="text-stone-400">
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <nav id="mobile-nav-menu" className="border-t border-stone-100 px-2 pb-2 space-y-1">
          {items.map((item) => {
            const active = isNavActive(pathname, item.href, allHrefs);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-3 text-sm font-medium min-h-[44px]",
                  active
                    ? "bg-wine/10 text-wine"
                    : "text-stone-700 hover:bg-stone-50"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
