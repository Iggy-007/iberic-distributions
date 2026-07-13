import Link from "next/link";
import { btnPrimary } from "@/lib/ui-classes";
import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white/80 px-6 py-10 text-center">
      <p className="font-medium text-stone-900">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto">{description}</p>
      )}
      {actionHref && actionLabel && (
        <Link href={actionHref} className={cn(btnPrimary, "mt-4 inline-flex")}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
