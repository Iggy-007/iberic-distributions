import { NextRequest, NextResponse } from "next/server";
import { ShippingType } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { canManageCatalog } from "@/lib/catalog-permissions";
import { notifyAdminsOfCatalogChange } from "@/lib/catalog-notifications";
import { logUserActivity } from "@/lib/user-activity";
import {
  createShippingService,
  listShippingServices,
} from "@/lib/shipping-rates";

const createSchema = z.object({
  type: z.nativeEnum(ShippingType),
  label: z.string().min(1),
  priceCents: z.number().int().min(0),
  supplier: z.string().optional(),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const activeOnly = request.nextUrl.searchParams.get("active") === "1";
  const typeParam = request.nextUrl.searchParams.get("type");
  const type =
    typeParam === "NATIONAL" || typeParam === "INTERNATIONAL"
      ? (typeParam as ShippingType)
      : undefined;

  const services = await listShippingServices({ activeOnly, type });
  return NextResponse.json(services);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !canManageCatalog(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    const service = await createShippingService(parsed.data);

    await logUserActivity({
      userId: session.user.id,
      action: "SHIPPING_RATES_UPDATED",
      summary: "Añadió un servicio de envío",
      detail: `${service.label} · ${service.priceCents / 100} €`,
      entityType: "shipping_service",
      entityId: service.id,
    });

    await notifyAdminsOfCatalogChange({
      type: "SHIPPING_RATES_UPDATED",
      summary: "Nuevo servicio de envío",
      detail: `${service.label} (${service.type === "NATIONAL" ? "nacional" : "internacional"}): ${(service.priceCents / 100).toFixed(2)} €`,
      actorUserId: session.user.id,
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo crear el servicio";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
