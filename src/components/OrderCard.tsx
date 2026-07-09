import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { CancelOrderButton } from "@/components/CancelOrderButton";
import { getDestinationSummary } from "@/lib/orders";
import { formatEuros } from "@/lib/shipping";
import type { OrderWithDetails } from "@/lib/orders";
import { FinalClientInfo, hasFinalClientData } from "@/components/FinalClientInfo";
import {
  orderHasEstimatedLines,
} from "@/lib/estimated-prices";
import { buildStoredOrderEstimate } from "@/lib/order-estimates";

export function OrderCard({
  order,
  href,
  showCancel = false,
}: {
  order: OrderWithDetails;
  href: string;
  showCancel?: boolean;
}) {
  const hasEstimates = orderHasEstimatedLines(order.lines);
  const estimate = buildStoredOrderEstimate(
    order.lines.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      lineTotalCents: line.lineTotalCents,
      variant: line.variant,
    }))
  );

  const summary = estimate.lines
    .map((l) => `${l.variantName} (${l.quantityLabel})`)
    .join(", ");

  const displayTotal = hasEstimates
    ? estimate.subtotalWithVatCents + order.shippingCostCents
    : order.totalCents;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 hover:border-wine/30 hover:shadow-sm transition">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Link href={href} className="flex-1 min-w-0">
          <p className="font-semibold text-stone-900">#{order.orderNumber}</p>
          {order.status === "CANCELLED" && order.cancellationNumber && (
            <p className="text-xs font-medium text-stone-500 mt-0.5">
              Nº cancelación: {order.cancellationNumber}
            </p>
          )}
          <p className="text-sm text-stone-600 mt-1">{summary}</p>
        </Link>
        <StatusBadge status={order.status} />
      </div>
      <Link href={href} className="block mt-3">
        <div className="flex flex-wrap gap-4 text-sm text-stone-500">
          {hasFinalClientData(order) && (
            <FinalClientInfo order={order} compact />
          )}
          <span>→ {getDestinationSummary(order)}</span>
          <span>
            {hasEstimates ? "Total estimado: " : "Total: "}
            {formatEuros(displayTotal)}
          </span>
          <span>{new Date(order.createdAt).toLocaleDateString("es-ES")}</span>
        </div>
      </Link>
      {showCancel && (
        <div className="mt-3 pt-3 border-t border-stone-100">
          <CancelOrderButton
            orderId={order.id}
            status={order.status}
            compact
          />
        </div>
      )}
    </div>
  );
}
