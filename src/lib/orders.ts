import { OrderStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "./prisma";

export const orderInclude = {
  clientOrg: true,
  createdBy: { select: { id: true, name: true, email: true } },
  lines: {
    include: {
      variant: { include: { product: true } },
    },
  },
  statusEvents: {
    orderBy: { createdAt: "asc" as const },
    include: { createdBy: { select: { name: true } } },
  },
  trackingToken: true,
} satisfies Prisma.OrderInclude;

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

export async function getOrdersForUser(
  userId: string,
  role: Role,
  organizationId: string | null
) {
  const where: Prisma.OrderWhereInput =
    role === Role.ADMIN
      ? {}
      : role === Role.CLIENT
        ? { clientOrgId: organizationId ?? undefined }
        : {};

  return prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderById(
  id: string,
  userId: string,
  role: Role,
  organizationId: string | null
) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });

  if (!order) return null;

  if (role === Role.CLIENT && order.clientOrgId !== organizationId) return null;
  return order;
}

export function getDestinationSummary(order: {
  destinationType: string;
  destName: string | null;
  destCity: string | null;
  destCountry: string;
  clientOrg?: { name: string; city: string | null };
}): string {
  if (order.destinationType === "CLIENT_WAREHOUSE") {
    return `${order.clientOrg?.name ?? order.destName ?? "Almacén"} — ${order.clientOrg?.city ?? order.destCity ?? "Málaga"}`;
  }
  return `${order.destName ?? "Cliente final"} — ${order.destCity ?? ""}, ${order.destCountry}`;
}

export function formatOrderLines(
  lines: OrderWithDetails["lines"]
): string {
  return lines
    .map(
      (l) =>
        `${l.variant.product.name} (${l.variant.name}) x${l.quantity}`
    )
    .join(", ");
}

export async function getOrderStats() {
  const [open, inProcess, shippedWeek, cancelled] = await Promise.all([
    prisma.order.count({
      where: {
        status: { in: ["SENT", "RECEIVED_BY_PROVIDER"] },
      },
    }),
    prisma.order.count({
      where: { status: "IN_PROCESS" },
    }),
    prisma.order.count({
      where: {
        status: "SHIPPED_TO_FINAL",
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
  ]);

  return { open, inProcess, shippedWeek, cancelled };
}

export async function getProviderPendingCount() {
  return prisma.order.count({
    where: {
      status: { notIn: ["SHIPPED_TO_FINAL", "CANCELLED"] },
    },
  });
}
