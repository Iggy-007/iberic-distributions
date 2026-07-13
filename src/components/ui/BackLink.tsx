import Link from "next/link";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-medium text-wine hover:underline mb-4"
    >
      <span aria-hidden>←</span>
      {children}
    </Link>
  );
}
