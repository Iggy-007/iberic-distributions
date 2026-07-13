import { NextRequest, NextResponse } from "next/server";
import { ShippingType } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { canManageCatalog } from "@/lib/catalog-permissions";
import { notifyAdminsOfCatalogChange } from "@/lib/catalog-notifications";
import { logUserActivity } from "@/lib/user-activity";
import {
  deleteShippingService,
  updateShippingService,
} from "@/lib/shipping-rates";

const patchSchema = z.object({
  type: z.nativeEnum(ShippingType).optional(),
  label: z.string().min(1).optional(),
  priceCents: z.number().int().min(0).optional(),
  supplier: z.string().optional(),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !canManageCatalog(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    const service = await updateShippingService(id, parsed.data);

    await logUserActivity({
      userId: session.user.id,
      action: "SHIPPING_RATES_UPDATED",
      summary: "Actualizó un servicio de envío",
      detail: service.label,
      entityType: "shipping_service",
      entityId: service.id,
    });

    await notifyAdminsOfCatalogChange({
      type: "SHIPPING_RATES_UPDATED",
      summary: "Servicio de envío actualizado",
      detail: `${service.label}: ${(service.priceCents / 100).toFixed(2)} €`,
      actorUserId: session.user.id,
    });

    return NextResponse.json(service);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo actualizar el servicio";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !canManageCatalog(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteShippingService(id);

    await logUserActivity({
      userId: session.user.id,
      action: "SHIPPING_RATES_UPDATED",
      summary: "Eliminó o desactivó un servicio de envío",
      entityType: "shipping_service",
      entityId: id,
    });

    await notifyAdminsOfCatalogChange({
      type: "SHIPPING_RATES_UPDATED",
      summary: "Servicio de envío eliminado o desactivado",
      actorUserId: session.user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo eliminar el servicio";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
