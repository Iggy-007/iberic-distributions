import type { OrderStatus, Role } from "@prisma/client";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  SENT: "Pedido solicitado al proveedor",
  RECEIVED_BY_PROVIDER: "Recibido por proveedor",
  IN_PROCESS: "En proceso",
  SHIPPED_TO_FINAL: "Enviado a cliente final",
  CANCELLED: "Pedido cancelado",
};

export const ORDER_STATUS_SHORT_LABELS: Record<OrderStatus, string> = {
  SENT: "Solicitado",
  RECEIVED_BY_PROVIDER: "Aceptado",
  IN_PROCESS: "En proceso",
  SHIPPED_TO_FINAL: "En envío",
  CANCELLED: "Cancelado",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  SENT: "bg-blue-100 text-blue-800",
  RECEIVED_BY_PROVIDER: "bg-amber-100 text-amber-800",
  IN_PROCESS: "bg-orange-100 text-orange-800",
  SHIPPED_TO_FINAL: "bg-green-100 text-green-800",
  CANCELLED: "bg-stone-200 text-stone-600",
};

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  SENT: "RECEIVED_BY_PROVIDER",
  RECEIVED_BY_PROVIDER: "IN_PROCESS",
  IN_PROCESS: "SHIPPED_TO_FINAL",
};

export const NEXT_STATUS_ACTION: Partial<Record<OrderStatus, string>> = {
  SENT: "Confirmar recepción",
  RECEIVED_BY_PROVIDER: "Marcar en proceso",
  IN_PROCESS: "Marcar enviado a cliente final",
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  CLIENT: "Cliente",
  PROVIDER: "Proveedor",
};

export const PROVIDER_KANBAN_COLUMNS = [
  { status: "SENT" as const, label: "Pedidos solicitados", variant: "workflow" as const },
  { status: "RECEIVED_BY_PROVIDER" as const, label: "Pedidos aceptados", variant: "workflow" as const },
  { status: "IN_PROCESS" as const, label: "En proceso", variant: "workflow" as const },
  { status: "SHIPPED_TO_FINAL" as const, label: "En envío", variant: "workflow" as const },
  { status: "CANCELLED" as const, label: "Pedidos cancelados", variant: "cancelled" as const },
];

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  CLIENT: "/client",
  PROVIDER: "/provider",
};

export const NATIONAL_SHIPPING_CENTS = 600;
export const INTERNATIONAL_SHIPPING_CENTS = 1500;

/** IVA reducido alimentación (España) */
export const VAT_RATE = 0.1;
export const VAT_PERCENT_LABEL = "10%";

export const SPAIN_COUNTRY_NAMES = ["España", "Spain", "ES"];
