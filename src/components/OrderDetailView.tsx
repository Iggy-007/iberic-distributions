import { Role } from "@prisma/client";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderTimeline } from "@/components/OrderTimeline";
import { OrderStatusActions } from "@/components/OrderStatusActions";
import { CancelOrderButton } from "@/components/CancelOrderButton";
import { formatEuros } from "@/lib/shipping";
import { formatVatPercentLabel } from "@/lib/pricing";
import {
  buildStoredOrderEstimate,
  type StoredOrderLine,
} from "@/lib/order-estimates";
import { orderHasEstimatedLines } from "@/lib/estimated-prices";
import { getDestinationSummary } from "@/lib/orders";
import type { OrderWithDetails } from "@/lib/orders";
import { FinalClientInfo } from "@/components/FinalClientInfo";
import { CarrierInfoBlock } from "@/components/CarrierInfoBlock";
import { getTrackingUrl } from "@/lib/utils";
import { ProviderLineActualsEditor } from "@/components/ProviderLineActualsEditor";
import { ProviderReactivateOrderButton } from "@/components/ProviderReactivateOrderButton";
import { toKanbanOrder } from "@/lib/kanban-types";
import {
  getOrderMissingActualsMessage,
  getPiecesLabel,
  orderHasRequiredActuals,
} from "@/lib/line-actuals";

export function OrderDetailView({
  order,
  role,
}: {
  order: OrderWithDetails;
  role: Role;
}) {
  const canSeeFullAddress =
    role === Role.ADMIN || role === Role.CLIENT || role === Role.PROVIDER;

  const storedLines: StoredOrderLine[] = order.lines.map((line) => ({
    id: line.id,
    quantity: line.quantity,
    lineTotalCents: line.lineTotalCents,
    variant: line.variant,
  }));

  const hasEstimates = orderHasEstimatedLines(order.lines);
  const estimate = buildStoredOrderEstimate(storedLines);

  const subtotalByRate = estimate.lines.reduce((acc, line) => {
    acc.set(
      line.vatRate,
      (acc.get(line.vatRate) ?? 0) + line.subtotalCents
    );
    return acc;
  }, new Map<number, number>());

  const vatByRate = estimate.lines.reduce((acc, line) => {
    acc.set(line.vatRate, (acc.get(line.vatRate) ?? 0) + line.vatCents);
    return acc;
  }, new Map<number, number>());

  const sortedVatRates = [
    ...new Set(estimate.lines.map((l) => l.vatRate)),
  ].sort((a, b) => a - b);

  const totalCents = estimate.subtotalWithVatCents + order.shippingCostCents;
  const missingActualsMessage =
    role === Role.PROVIDER && !orderHasRequiredActuals(order.lines)
      ? getOrderMissingActualsMessage(order.lines)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Pedido #{order.orderNumber}
          </h1>
          {order.status === "CANCELLED" && order.cancellationNumber && (
            <p className="text-sm font-medium text-stone-600 mt-1">
              Nº cancelación: {order.cancellationNumber}
            </p>
          )}
          <p className="text-stone-500 mt-1">
            {order.clientOrg.name} ·{" "}
            {new Date(order.createdAt).toLocaleString("es-ES")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <StatusBadge status={order.status} />
          {role === Role.CLIENT && (
            <CancelOrderButton orderId={order.id} status={order.status} />
          )}
        </div>
      </div>

      {role === Role.PROVIDER && (
        <ProviderLineActualsEditor
          orderId={order.id}
          lines={toKanbanOrder(order).lines}
          cancelled={order.status === "CANCELLED"}
        />
      )}

      {role === Role.PROVIDER && order.status === "CANCELLED" && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-900 mb-2">
            Reactivar pedido
          </h2>
          <p className="text-sm text-stone-600 mb-4">
            El pedido volverá a la columna «Pedidos solicitados» del tablero.
          </p>
          <ProviderReactivateOrderButton orderId={order.id} />
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-900 mb-1">Productos</h2>
          {hasEstimates && (
            <p className="text-xs text-stone-500 mb-4">
              Importes estimados según unidades pedidas y peso orientativo.
            </p>
          )}
          <ul className="space-y-3">
            {estimate.lines.map((line) => {
              const orderLine = order.lines.find((l) => l.id === line.key);
              return (
              <li key={line.key} className="border-b border-stone-100 pb-3">
                <p className="text-sm font-medium text-stone-900">
                  {line.productName} — {line.variantName}{" "}
                  <span className="font-normal text-stone-500">
                    ({line.quantityLabel})
                  </span>
                </p>
                {line.priceFormula && (
                  <p className="text-xs text-stone-500 mt-0.5">
                    {line.priceFormula}
                  </p>
                )}
                {orderLine?.actualWeightKg != null && (
                  <p className="text-xs text-stone-600 mt-0.5">
                    Peso real: {orderLine.actualWeightKg} kg
                  </p>
                )}
                {orderLine?.actualPieceCount != null && (
                  <p className="text-xs text-stone-600 mt-0.5">
                    {getPiecesLabel(line.variantName) ?? "Unidades reales"}:{" "}
                    {orderLine.actualPieceCount}
                  </p>
                )}
                {(role === Role.PROVIDER || role === Role.ADMIN) &&
                  orderLine?.galvanInternalId && (
                    <p className="text-xs text-stone-600 mt-0.5">
                      ID interno Galvan: {orderLine.galvanInternalId}
                    </p>
                  )}
                <div className="mt-1 grid gap-0.5 text-xs text-stone-600 sm:text-sm">
                  <div className="flex justify-between">
                    <span>sin IVA</span>
                    <span>{formatEuros(line.subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA ({formatVatPercentLabel(line.vatRate)})</span>
                    <span>{formatEuros(line.vatCents)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-stone-900">
                    <span>con IVA</span>
                    <span>{formatEuros(line.totalWithVatCents)}</span>
                  </div>
                </div>
              </li>
              );
            })}
          </ul>

          <div className="mt-4 space-y-1 text-sm pt-2 border-t border-stone-200">
            {hasEstimates &&
              sortedVatRates.map((rate) => (
                <div
                  key={`base-${rate}`}
                  className="flex justify-between text-stone-600 pl-2"
                >
                  <span>Base imponible ({formatVatPercentLabel(rate)})</span>
                  <span>{formatEuros(subtotalByRate.get(rate) ?? 0)}</span>
                </div>
              ))}
            <div className="flex justify-between text-stone-600">
              <span>Subtotal (sin IVA)</span>
              <span>{formatEuros(estimate.subtotalCents)}</span>
            </div>
            {hasEstimates &&
              sortedVatRates.map((rate) => (
                <div
                  key={`vat-${rate}`}
                  className="flex justify-between text-stone-600 pl-2"
                >
                  <span>IVA ({formatVatPercentLabel(rate)})</span>
                  <span>{formatEuros(vatByRate.get(rate) ?? 0)}</span>
                </div>
              ))}
            <div className="flex justify-between text-stone-600">
              <span>Total IVA</span>
              <span>{formatEuros(estimate.vatCents)}</span>
            </div>
            <div className="flex justify-between font-medium text-stone-900 pt-1 border-t border-stone-100">
              <span>Subtotal (con IVA)</span>
              <span>{formatEuros(estimate.subtotalWithVatCents)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>
                Envío{" "}
                {order.shippingType === "NATIONAL"
                  ? "nacional"
                  : "internacional"}
              </span>
              <span>{formatEuros(order.shippingCostCents)}</span>
            </div>
            <div className="flex justify-between font-semibold text-stone-900 pt-2 border-t">
              <span>{hasEstimates ? "Total estimado" : "Total"}</span>
              <span>{formatEuros(totalCents)}</span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-900 mb-4">Cliente final</h2>
          {canSeeFullAddress ? (
            <FinalClientInfo order={order} />
          ) : (
            <FinalClientInfo order={order} compact />
          )}
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-5 lg:col-span-2">
          <h2 className="font-semibold text-stone-900 mb-4">Destino de envío</h2>
          <p className="font-medium">{getDestinationSummary(order)}</p>
          {canSeeFullAddress && order.destStreet && (
            <p className="text-sm text-stone-600 mt-2">
              {order.destStreet}
              <br />
              {order.destPostalCode} {order.destCity}
              <br />
              {order.destCountry}
            </p>
          )}
          {order.destEmail && (
            <p className="text-sm text-stone-500 mt-2">
              Email seguimiento: {order.destEmail}
            </p>
          )}
          {order.trackingToken && (
            <p className="text-sm text-stone-500 mt-2">
              Enlace de seguimiento:{" "}
              <Link
                href={`/tracking/${order.trackingToken.token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-wine hover:underline break-all"
              >
                {getTrackingUrl(order.trackingToken.token)}
              </Link>
            </p>
          )}
          <div className="mt-4">
            <CarrierInfoBlock
              carrier={{
                carrierCompany: order.carrierCompany,
                carrierTrackingNumber: order.carrierTrackingNumber,
                carrierPhone: order.carrierPhone,
              }}
            />
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold text-stone-900 mb-4">Estado del pedido</h2>
        <OrderTimeline events={order.statusEvents} currentStatus={order.status} />
        {(role === Role.PROVIDER || role === Role.ADMIN) &&
          order.status !== "CANCELLED" && (
            <div className="mt-6 pt-6 border-t border-stone-100">
              <OrderStatusActions
                orderId={order.id}
                currentStatus={order.status}
                missingActualsMessage={missingActualsMessage}
                carrier={{
                  carrierCompany: order.carrierCompany,
                  carrierTrackingNumber: order.carrierTrackingNumber,
                  carrierPhone: order.carrierPhone,
                }}
              />
            </div>
          )}
      </section>
    </div>
  );
}
