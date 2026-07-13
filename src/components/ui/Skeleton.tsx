import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-stone-200/80", className)}
      aria-hidden
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
