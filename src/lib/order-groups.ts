import type { OrderStatus } from "@prisma/client";

export const ORDER_GROUP_LABELS = {
  active: "Pedidos activos",
  inProgress: "En proceso y enviados",
  cancelled: "Pedidos cancelados",
} as const;

/** Pendientes de acción del proveedor o recién solicitados */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "SENT",
  "RECEIVED_BY_PROVIDER",
];

/** En preparación o ya enviados al cliente final */
export const IN_PROGRESS_ORDER_STATUSES: OrderStatus[] = [
  "IN_PROCESS",
  "SHIPPED_TO_FINAL",
];

export const CANCELLED_ORDER_STATUS: OrderStatus = "CANCELLED";

export function canClientCancelOrder(status: OrderStatus): boolean {
  return status !== "CANCELLED" && status !== "SHIPPED_TO_FINAL";
}

export function groupOrdersByStatus<T extends { status: OrderStatus }>(
  orders: T[]
) {
  return {
    active: orders.filter((o) =>
      ACTIVE_ORDER_STATUSES.includes(o.status)
    ),
    inProgress: orders.filter((o) =>
      IN_PROGRESS_ORDER_STATUSES.includes(o.status)
    ),
    cancelled: orders.filter((o) => o.status === CANCELLED_ORDER_STATUS),
  };
}
