import { CardSkeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded-lg bg-stone-200 animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <CardSkeleton />
    </div>
  );
}
