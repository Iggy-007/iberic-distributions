"use client";

import { Button } from "@/components/ui/Button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center space-y-4">
      <p className="font-medium text-red-900">No se pudo cargar esta página</p>
      <p className="text-sm text-red-700">{error.message}</p>
      <Button variant="secondary" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
