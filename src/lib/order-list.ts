import { OrderStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "./prisma";
import { orderInclude, type OrderWithDetails } from "./orders";

export const HISTORY_CUTOFF_DAYS = 14;
export const ORDER_LIST_PAGE_SIZE = 25;

export type OrderListView = "operational" | "history";

export interface OrderListParams {
  view: OrderListView;
  q: string;
  status: OrderStatus | "";
  from: string;
  to: string;
  page: number;
}

const ALL_STATUSES: OrderStatus[] = [
  "SENT",
  "RECEIVED_BY_PROVIDER",
  "IN_PROCESS",
  "SHIPPED_TO_FINAL",
  "CANCELLED",
];

export function getHistoryCutoffDate(): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - HISTORY_CUTOFF_DAYS);
  cutoff.setHours(0, 0, 0, 0);
  return cutoff;
}

export function parseOrderListSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): OrderListParams {
  const raw = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const view = raw("view") === "history" ? "history" : "operational";
  const statusRaw = raw("status") ?? "";
  const status = ALL_STATUSES.includes(statusRaw as OrderStatus)
    ? (statusRaw as OrderStatus)
    : "";

  const page = Math.max(1, Number.parseInt(raw("page") ?? "1", 10) || 1);

  return {
    view,
    q: (raw("q") ?? "").trim(),
    status,
    from: raw("from") ?? "",
    to: raw("to") ?? "",
    page,
  };
}

export function buildOrderListQuery(
  params: Partial<OrderListParams> & { view?: OrderListView }
): string {
  const next: OrderListParams = {
    view: params.view ?? "operational",
    q: params.q ?? "",
    status: params.status ?? "",
    from: params.from ?? "",
    to: params.to ?? "",
    page: params.page ?? 1,
  };

  const sp = new URLSearchParams();
  if (next.view !== "operational") sp.set("view", next.view);
  if (next.q) sp.set("q", next.q);
  if (next.status) sp.set("status", next.status);
  if (next.from) sp.set("from", next.from);
  if (next.to) sp.set("to", next.to);
  if (next.page > 1) sp.set("page", String(next.page));

  const query = sp.toString();
  return query ? `?${query}` : "";
}

function buildBaseFilters(
  params: OrderListParams,
  organizationId: string | null
): Prisma.OrderWhereInput {
  const filters: Prisma.OrderWhereInput[] = [];

  if (organizationId) {
    filters.push({ clientOrgId: organizationId });
  }

  if (params.q) {
    filters.push({
      OR: [
        { orderNumber: { contains: params.q } },
        { clientOrg: { name: { contains: params.q } } },
        { destName: { contains: params.q } },
      ],
    });
  }

  if (params.status) {
    filters.push({ status: params.status });
  }

  if (params.from) {
    const from = new Date(params.from);
    if (!Number.isNaN(from.getTime())) {
      filters.push({ createdAt: { gte: from } });
    }
  }

  if (params.to) {
    const to = new Date(params.to);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      filters.push({ createdAt: { lte: to } });
    }
  }

  return filters.length > 0 ? { AND: filters } : {};
}

function buildOperationalScope(): Prisma.OrderWhereInput {
  const cutoff = getHistoryCutoffDate();
  return {
    OR: [
      { status: { in: ["SENT", "RECEIVED_BY_PROVIDER", "IN_PROCESS"] } },
      {
        status: { in: ["SHIPPED_TO_FINAL", "CANCELLED"] },
        updatedAt: { gte: cutoff },
      },
    ],
  };
}

function buildHistoryScope(): Prisma.OrderWhereInput {
  const cutoff = getHistoryCutoffDate();
  return {
    status: { in: ["SHIPPED_TO_FINAL", "CANCELLED"] },
    updatedAt: { lt: cutoff },
  };
}

function mergeWhere(
  ...parts: Prisma.OrderWhereInput[]
): Prisma.OrderWhereInput {
  const valid = parts.filter((p) => Object.keys(p).length > 0);
  if (valid.length === 0) return {};
  if (valid.length === 1) return valid[0];
  return { AND: valid };
}

export async function fetchOperationalOrders(
  params: OrderListParams,
  organizationId: string | null
): Promise<OrderWithDetails[]> {
  const where = mergeWhere(
    buildBaseFilters(params, organizationId),
    buildOperationalScope()
  );

  return prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function fetchHistoryOrders(
  params: OrderListParams,
  organizationId: string | null
): Promise<{ orders: OrderWithDetails[]; total: number; totalPages: number }> {
  const where = mergeWhere(
    buildBaseFilters(params, organizationId),
    buildHistoryScope()
  );

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * ORDER_LIST_PAGE_SIZE,
      take: ORDER_LIST_PAGE_SIZE,
    }),
  ]);

  return {
    orders,
    total,
    totalPages: Math.max(1, Math.ceil(total / ORDER_LIST_PAGE_SIZE)),
  };
}

export interface MonthOrderGroup {
  key: string;
  label: string;
  orders: OrderWithDetails[];
}

export function groupOrdersByMonth(
  orders: OrderWithDetails[]
): MonthOrderGroup[] {
  const map = new Map<string, MonthOrderGroup>();

  for (const order of orders) {
    const date = new Date(order.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });

    const existing = map.get(key);
    if (existing) {
      existing.orders.push(order);
    } else {
      map.set(key, {
        key,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        orders: [order],
      });
    }
  }

  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
}

export async function countHistoryOrders(
  params: OrderListParams,
  organizationId: string | null
): Promise<number> {
  const where = mergeWhere(
    buildBaseFilters(params, organizationId),
    buildHistoryScope()
  );
  return prisma.order.count({ where });
}

export async function countOperationalOrders(
  params: OrderListParams,
  organizationId: string | null
): Promise<number> {
  const where = mergeWhere(
    buildBaseFilters(params, organizationId),
    buildOperationalScope()
  );
  return prisma.order.count({ where });
}

export function getOrderListRoleFilter(
  role: Role,
  organizationId: string | null
): string | null {
  return role === Role.CLIENT ? organizationId : null;
}
