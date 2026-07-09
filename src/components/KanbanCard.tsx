"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { formatEuros } from "@/lib/shipping";
import { orderHasRequiredActuals } from "@/lib/line-actuals";
import { buildStoredOrderEstimate } from "@/lib/order-estimates";
import type { KanbanOrder } from "@/lib/kanban-types";

export function KanbanCard({
  order,
  onSelect,
  onDragStart,
  draggable = true,
  cancelled = false,
}: {
  order: KanbanOrder;
  onSelect: () => void;
  onDragStart: () => void;
  draggable?: boolean;
  cancelled?: boolean;
}) {
  const router = useRouter();
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const estimate = buildStoredOrderEstimate(
    order.lines.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      lineTotalCents: line.lineTotalCents,
      variant: line.variant,
    }))
  );
  const total = estimate.subtotalWithVatCents + order.shippingCostCents;
  const complete = orderHasRequiredActuals(order.lines);
  const summary = estimate.lines.map((l) => l.variantName).join(", ");

  function handleClick() {
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      onSelect();
      clickTimer.current = null;
    }, 220);
  }

  function handleDoubleClick() {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    router.push(`/provider/orders/${order.id}`);
  }

  return (
    <article
      draggable={draggable}
      onDragStart={
        draggable
          ? (e) => {
              e.dataTransfer.setData("text/order-id", order.id);
              e.dataTransfer.effectAllowed = "move";
              onDragStart();
            }
          : undefined
      }
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title="Clic: datos reales · Doble clic: ver detalle"
      className={`cursor-pointer rounded-lg border p-3 shadow-sm transition hover:shadow-md ${
        cancelled
          ? "border-stone-400 bg-stone-100/90"
          : complete
            ? "border-stone-200 bg-white"
            : "border-amber-300 bg-white ring-1 ring-amber-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={`font-semibold ${
            cancelled ? "text-stone-700" : "text-stone-900"
          }`}
        >
          #{order.orderNumber}
        </p>
        {!cancelled && !complete && (
          <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
            Datos pendientes
          </span>
        )}
        {cancelled && (
          <span className="shrink-0 rounded bg-stone-300 px-1.5 py-0.5 text-[10px] font-medium text-stone-700">
            Cancelado
          </span>
        )}
      </div>
      {cancelled && order.cancellationNumber && (
        <p className="mt-1 text-xs font-medium text-stone-600">
          Nº cancelación: {order.cancellationNumber}
        </p>
      )}
      <p className="mt-1 text-xs text-stone-500">{order.clientOrg.name}</p>
      <p className="mt-2 text-xs text-stone-600 line-clamp-2">{summary}</p>
      <p
        className={`mt-2 text-sm font-medium ${
          cancelled ? "text-stone-600" : "text-stone-900"
        }`}
      >
        {formatEuros(total)}
      </p>
    </article>
  );
}
