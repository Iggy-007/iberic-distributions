"use client";

import { useRouter } from "next/navigation";
import { formatEuros } from "@/lib/shipping";
import { NEXT_STATUS, NEXT_STATUS_ACTION } from "@/lib/constants";
import { orderHasRequiredActuals } from "@/lib/line-actuals";
import { buildStoredOrderEstimate } from "@/lib/order-estimates";
import type { KanbanOrder } from "@/lib/kanban-types";
import { btnGhost, btnPrimary, btnSecondary } from "@/lib/ui-classes";

export function KanbanCard({
  order,
  onOpenActuals,
  onAdvance,
  onDragStart,
  draggable = true,
  cancelled = false,
  showAdvance = false,
}: {
  order: KanbanOrder;
  onOpenActuals: () => void;
  onAdvance?: () => void;
  onDragStart: () => void;
  draggable?: boolean;
  cancelled?: boolean;
  showAdvance?: boolean;
}) {
  const router = useRouter();

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
  const nextStatus = NEXT_STATUS[order.status];
  const advanceLabel = nextStatus
    ? NEXT_STATUS_ACTION[order.status]
    : null;

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
      className={`rounded-lg border p-3 shadow-sm transition ${
        cancelled
          ? "border-stone-400 bg-stone-100/90"
          : complete
            ? "border-stone-200 bg-white"
            : "border-amber-300 bg-white ring-1 ring-amber-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => router.push(`/provider/orders/${order.id}`)}
          className="text-left font-semibold text-stone-900 hover:text-wine hover:underline"
        >
          #{order.orderNumber}
        </button>
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
      <p className="mt-2 text-sm font-medium text-stone-900">{formatEuros(total)}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {!cancelled && (
          <button type="button" onClick={onOpenActuals} className={btnSecondary + " !min-h-0 !py-1 !px-2 text-xs"}>
            Datos reales
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push(`/provider/orders/${order.id}`)}
          className={btnGhost + " !min-h-0 !py-1 !px-2 text-xs"}
        >
          Ver detalle
        </button>
        {showAdvance && onAdvance && advanceLabel && !cancelled && (
          <button
            type="button"
            onClick={onAdvance}
            className={btnPrimary + " !min-h-0 !py-1 !px-2 text-xs"}
          >
            {advanceLabel}
          </button>
        )}
      </div>
    </article>
  );
}
