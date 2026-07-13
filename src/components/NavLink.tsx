"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export function NavLink({
  href,
  label,
  allHrefs,
}: {
  href: string;
  label: string;
  allHrefs: string[];
}) {
  const pathname = usePathname();
  const active = isNavActive(pathname, href, allHrefs);

  return (
    <Link
      href={href}
      className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition sm:px-4 min-h-[44px] inline-flex items-center ${
        active
          ? "border-wine text-wine"
          : "border-transparent text-stone-600 hover:border-wine/40 hover:text-wine"
      }`}
    >
      {label}
    </Link>
  );
}
