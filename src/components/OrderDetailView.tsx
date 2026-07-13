import { Role } from "@prisma/client";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderTimeline } from "@/components/OrderTimeline";
import { OrderStatusActions } from "@/components/OrderStatusActions";
import { CancelOrderButton } from "@/components/CancelOrderButton";
import { formatEuros } from "@/lib/shipping";
import { orderShippingLabel } from "@/lib/shipping-rates";
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
import { CopyTrackingButton } from "@/components/CopyTrackingButton";
import { BackLink } from "@/components/ui/BackLink";
import { ProviderLineActualsEditor } from "@/components/ProviderLineActualsEditor";
import { ProviderReactivateOrderButton } from "@/components/ProviderReactivateOrderButton";
import { ProductGalvanReference } from "@/components/ProductGalvanReference";
import { OrderFinancialSummary } from "@/components/OrderFinancialSummary";
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

  const missingActualsMessage =
    role === Role.PROVIDER && !orderHasRequiredActuals(order.lines)
      ? getOrderMissingActualsMessage(order.lines)
      : null;

  const backHref =
    role === Role.CLIENT
      ? "/client/orders"
      : role === Role.PROVIDER
        ? "/provider/orders"
        : "/admin/orders";
  const backLabel =
    role === Role.CLIENT
      ? "Mis pedidos"
      : role === Role.PROVIDER
        ? "Tablero de pedidos"
        : "Todos los pedidos";

  return (
    <div className="space-y-6">
      <BackLink href={backHref}>{backLabel}</BackLink>
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
          {(role === Role.CLIENT || role === Role.PROVIDER) && (
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
          <OrderFinancialSummary
            lines={estimate.lines}
            shippingCostCents={order.shippingCostCents}
            shippingLabel={orderShippingLabel(order)}
            isEstimate={hasEstimates}
            renderLineExtra={(line) => {
              const orderLine = order.lines.find((l) => l.id === line.key);
              if (!orderLine) return null;

              return (
                <div className="mt-1 space-y-0.5 text-xs text-stone-600">
                  <ProductGalvanReference
                    reference={orderLine.variant.product.galvanReference}
                    compact
                  />
                  {orderLine.actualWeightKg != null && (
                    <p>Peso real: {orderLine.actualWeightKg} kg</p>
                  )}
                  {orderLine.actualPieceCount != null && (
                    <p>
                      {getPiecesLabel(
                        line.variantName,
                        line.productName,
                        orderLine.variant.presentation
                      ) ?? "Unidades reales"}
                      : {orderLine.actualPieceCount}
                    </p>
                  )}
                  {(role === Role.PROVIDER || role === Role.ADMIN) &&
                    orderLine.galvanInternalId && (
                      <p>ID interno Galvan: {orderLine.galvanInternalId}</p>
                    )}
                </div>
              );
            }}
          />
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
            <div className="text-sm text-stone-500 mt-2 space-y-2">
              <p>
                Enlace de seguimiento:{" "}
                <Link
                  href={`/tracking/${order.trackingToken.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wine hover:underline break-all"
                >
                  /tracking/{order.trackingToken.token}
                </Link>
              </p>
              {role === Role.CLIENT && (
                <CopyTrackingButton
                  url={getTrackingUrl(order.trackingToken.token)}
                />
              )}
            </div>
          )}
          <div className="mt-4">
            <CarrierInfoBlock
              carrier={{
                carrierCompany: order.carrierCompany,
                carrierTrackingNumber: order.carrierTrackingNumber,
                carrierTrackingUrl: order.carrierTrackingUrl,
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
                  carrierTrackingUrl: order.carrierTrackingUrl,
                  carrierPhone: order.carrierPhone,
                }}
              />
            </div>
          )}
      </section>
    </div>
  );
}
