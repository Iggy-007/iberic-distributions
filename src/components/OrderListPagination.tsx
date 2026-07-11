import Link from "next/link";
import {
  buildOrderListQuery,
  type OrderListParams,
} from "@/lib/order-list";

export function OrderListPagination({
  params,
  totalPages,
  total,
}: {
  params: OrderListParams;
  totalPages: number;
  total: number;
}) {
  if (totalPages <= 1) return null;

  const prev = params.page > 1 ? params.page - 1 : null;
  const next = params.page < totalPages ? params.page + 1 : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-sm text-stone-500">
        {total} pedido{total !== 1 ? "s" : ""} · Página {params.page} de{" "}
        {totalPages}
      </p>
      <div className="flex gap-2">
        {prev ? (
          <Link
            href={buildOrderListQuery({ ...params, page: prev })}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
          >
            Anterior
          </Link>
        ) : (
          <span className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-400">
            Anterior
          </span>
        )}
        {next ? (
          <Link
            href={buildOrderListQuery({ ...params, page: next })}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
          >
            Siguiente
          </Link>
        ) : (
          <span className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-400">
            Siguiente
          </span>
        )}
      </div>
    </div>
  );
}
