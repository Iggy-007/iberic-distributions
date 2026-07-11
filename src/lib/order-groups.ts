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

export function canCancelOrder(status: OrderStatus): boolean {
  return (
    status !== "CANCELLED" &&
    status !== "IN_PROCESS" &&
    status !== "SHIPPED_TO_FINAL"
  );
}

/** @deprecated Use canCancelOrder */
export const canClientCancelOrder = canCancelOrder;

export function getCancelBlockedMessage(status: OrderStatus): string | null {
  if (status === "CANCELLED") {
    return "Este pedido ya está cancelado.";
  }
  if (status === "IN_PROCESS") {
    return "No se puede cancelar un pedido que ya está en proceso.";
  }
  if (status === "SHIPPED_TO_FINAL") {
    return "No se puede cancelar un pedido que ya está en envío.";
  }
  return null;
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
