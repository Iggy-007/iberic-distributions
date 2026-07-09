import type { OrderStatus } from "@prisma/client";
import type { PriceType } from "@prisma/client";

export interface KanbanOrderLine {
  id: string;
  quantity: number;
  lineTotalCents: number;
  unitPriceCents: number;
  actualWeightKg: number | null;
  actualPieceCount: number | null;
  galvanInternalId: string | null;
  variant: {
    id: string;
    name: string;
    unitLabel: string;
    priceType: PriceType;
    priceCents: number;
    vatRate: number;
    product: { name: string };
  };
}

export interface KanbanOrder {
  id: string;
  orderNumber: string;
  cancellationNumber: string | null;
  status: OrderStatus;
  shippingCostCents: number;
  carrierCompany: string | null;
  carrierTrackingNumber: string | null;
  carrierPhone: string | null;
  createdAt: string;
  clientOrg: { name: string };
  lines: KanbanOrderLine[];
}

export function toKanbanOrder(order: {
  id: string;
  orderNumber: string;
  cancellationNumber: string | null;
  status: OrderStatus;
  shippingCostCents: number;
  carrierCompany: string | null;
  carrierTrackingNumber: string | null;
  carrierPhone: string | null;
  createdAt: Date;
  clientOrg: { name: string };
  lines: Array<{
    id: string;
    quantity: number;
    lineTotalCents: number;
    unitPriceCents: number;
    actualWeightKg: number | null;
    actualPieceCount: number | null;
    galvanInternalId: string | null;
    variant: {
      id: string;
      name: string;
      unitLabel: string;
      priceType: PriceType;
      priceCents: number;
      vatRate: number;
      product: { name: string };
    };
  }>;
}): KanbanOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    cancellationNumber: order.cancellationNumber,
    status: order.status,
    shippingCostCents: order.shippingCostCents,
    carrierCompany: order.carrierCompany,
    carrierTrackingNumber: order.carrierTrackingNumber,
    carrierPhone: order.carrierPhone,
    createdAt: order.createdAt.toISOString(),
    clientOrg: { name: order.clientOrg.name },
    lines: order.lines.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      lineTotalCents: line.lineTotalCents,
      unitPriceCents: line.unitPriceCents,
      actualWeightKg: line.actualWeightKg,
      actualPieceCount: line.actualPieceCount,
      galvanInternalId: line.galvanInternalId,
      variant: line.variant,
    })),
  };
}
