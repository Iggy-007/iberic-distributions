import Link from "next/link";
import { PROVIDER_KANBAN_COLUMNS } from "@/lib/constants";
import { getKanbanStatusCounts } from "@/lib/orders";
import { btnPrimary } from "@/lib/ui-classes";

export default async function ProviderDashboardPage() {
  const counts = await getKanbanStatusCounts();
  const pending =
    counts.SENT +
    counts.RECEIVED_BY_PROVIDER +
    counts.IN_PROCESS;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Panel Galvan</h1>
          <p className="text-stone-500 mt-1">Resumen de pedidos y catálogo</p>
        </div>
        <Link href="/provider/orders" className={btnPrimary}>
          Ir al tablero
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/provider/orders"
          className="rounded-xl border border-stone-200 bg-white p-5 hover:border-wine/30 transition"
        >
          <p className="text-sm text-stone-500">Pedidos activos</p>
          <p className="text-3xl font-bold text-wine mt-1">{pending}</p>
        </Link>
        {PROVIDER_KANBAN_COLUMNS.filter((c) => c.variant === "workflow").map(
          (col) => (
            <Link
              key={col.status}
              href="/provider/orders"
              className="rounded-xl border border-stone-200 bg-white p-5 hover:border-wine/30 transition"
            >
              <p className="text-sm text-stone-500">{col.label}</p>
              <p className="text-3xl font-bold text-stone-900 mt-1">
                {counts[col.status]}
              </p>
            </Link>
          )
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/provider/catalog"
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-white"
        >
          Gestionar catálogo
        </Link>
      </div>
    </div>
  );
}
