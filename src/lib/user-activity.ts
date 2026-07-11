import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export interface ActivityTimelineItem {
  id: string;
  at: string;
  summary: string;
  detail: string | null;
  category: "order" | "account" | "product";
  href: string | null;
}

export async function logUserActivity(input: {
  userId: string;
  action: string;
  summary: string;
  detail?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}) {
  const delegate = (
    prisma as { userActivityLog?: { create: (args: unknown) => Promise<unknown> } }
  ).userActivityLog;

  if (!delegate) return;

  try {
    await delegate.create({
      data: {
        userId: input.userId,
        action: input.action,
        summary: input.summary,
        detail: input.detail ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      },
    });
  } catch {
    // Prisma client may be stale until dev server restart
  }
}

export async function getUserActivityTimeline(
  userId: string
): Promise<ActivityTimelineItem[]> {
  const logsPromise = fetchUserActivityLogs(userId);

  const [logs, ordersCreated, statusEvents] = await Promise.all([
    logsPromise,
    prisma.order.findMany({
      where: { createdByUserId: userId },
      select: { id: true, orderNumber: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.orderStatusEvent.findMany({
      where: { createdByUserId: userId },
      include: { order: { select: { id: true, orderNumber: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const items: ActivityTimelineItem[] = [
    ...logs.map((log) => ({
      id: `log-${log.id}`,
      at: log.createdAt.toISOString(),
      summary: log.summary,
      detail: log.detail,
      category:
        log.entityType === "product"
          ? ("product" as const)
          : log.entityType === "user"
            ? ("account" as const)
            : ("order" as const),
      href:
        log.entityType === "order" && log.entityId
          ? `/admin/orders/${log.entityId}`
          : null,
    })),
    ...ordersCreated.map((order) => ({
      id: `order-${order.id}`,
      at: order.createdAt.toISOString(),
      summary: `Creó pedido #${order.orderNumber}`,
      detail: null,
      category: "order" as const,
      href: `/admin/orders/${order.id}`,
    })),
    ...statusEvents.map((event) => ({
      id: `event-${event.id}`,
      at: event.createdAt.toISOString(),
      summary: `${ORDER_STATUS_LABELS[event.status]} — pedido #${event.order.orderNumber}`,
      detail: event.note,
      category: "order" as const,
      href: `/admin/orders/${event.order.id}`,
    })),
  ];

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return items;
}

async function fetchUserActivityLogs(userId: string) {
  type ActivityLogRow = {
    id: string;
    createdAt: Date;
    summary: string;
    detail: string | null;
    entityType: string | null;
    entityId: string | null;
  };

  const delegate = (
    prisma as {
      userActivityLog?: {
        findMany: (args: unknown) => Promise<ActivityLogRow[]>;
      };
    }
  ).userActivityLog;

  if (!delegate) return [];

  try {
    return await delegate.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}
