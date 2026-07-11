import { Role } from "@prisma/client";
import { sendCatalogChangeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export type CatalogChangeType =
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_DOCUMENT_ADDED"
  | "PRODUCT_DOCUMENT_REMOVED"
  | "SHIPPING_RATES_UPDATED";

export async function notifyAdminsOfCatalogChange(input: {
  type: CatalogChangeType;
  summary: string;
  detail?: string | null;
  productId?: string | null;
  actorUserId: string;
}) {
  const actor = await prisma.user.findUnique({
    where: { id: input.actorUserId },
    select: { id: true, name: true, role: true, email: true },
  });

  if (!actor) return;

  const actorLabel =
    actor.role === Role.PROVIDER
      ? `Proveedor (${actor.name})`
      : actor.role === Role.ADMIN
        ? `Administrador (${actor.name})`
        : actor.name;

  const detail = input.detail
    ? `${input.detail}\n\nRealizado por: ${actorLabel}`
    : `Realizado por: ${actorLabel}`;

  await prisma.catalogNotification.create({
    data: {
      type: input.type,
      summary: input.summary,
      detail,
      productId: input.productId ?? null,
      actorUserId: input.actorUserId,
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN, active: true },
    select: { email: true },
  });

  const recipients = admins
    .map((a) => a.email)
    .filter((email) => email !== actor.email);

  if (recipients.length === 0) return;

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  await sendCatalogChangeEmail({
    to: recipients,
    summary: input.summary,
    detail,
    productsUrl: `${baseUrl}/admin/products`,
  });
}

export async function getUnreadCatalogNotificationCount(): Promise<number> {
  return prisma.catalogNotification.count({ where: { read: false } });
}
