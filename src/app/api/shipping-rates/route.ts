import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { canManageCatalog } from "@/lib/catalog-permissions";
import { notifyAdminsOfCatalogChange } from "@/lib/catalog-notifications";
import { logUserActivity } from "@/lib/user-activity";
import { getShippingRates, updateShippingRates } from "@/lib/shipping-rates";

const patchSchema = z.object({
  nationalCents: z.number().int().min(0),
  internationalCents: z.number().int().min(0),
  supplier: z.string().optional(),
});

export async function GET() {
  const rates = await getShippingRates();
  return NextResponse.json(rates);
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || !canManageCatalog(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const rates = await updateShippingRates(parsed.data);

  await logUserActivity({
    userId: session.user.id,
    action: "SHIPPING_RATES_UPDATED",
    summary: "Actualizó el servicio de envío",
    detail: `Nacional ${parsed.data.nationalCents / 100} € · Internacional ${parsed.data.internationalCents / 100} €${parsed.data.supplier ? ` · Proveedor: ${parsed.data.supplier}` : ""}`,
    entityType: "product",
  });

  await notifyAdminsOfCatalogChange({
    type: "SHIPPING_RATES_UPDATED",
    summary: "Servicio de envío actualizado",
    detail: `Nacional: ${(parsed.data.nationalCents / 100).toFixed(2)} € · Internacional: ${(parsed.data.internationalCents / 100).toFixed(2)} €${parsed.data.supplier ? `\nProveedor: ${parsed.data.supplier}` : ""}`,
    actorUserId: session.user.id,
  });

  return NextResponse.json(rates);
}
