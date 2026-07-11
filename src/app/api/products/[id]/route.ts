import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCatalog } from "@/lib/catalog-permissions";
import { notifyAdminsOfCatalogChange } from "@/lib/catalog-notifications";
import { logUserActivity } from "@/lib/user-activity";
import { updateProductWithOfferingsSchema } from "@/lib/product-offerings-schema";
import { syncProductOfferings } from "@/lib/product-variant-sync";

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
  const parsed = updateProductWithOfferingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { offerings, ...productData } = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (Object.keys(productData).length > 0) {
      await tx.product.update({ where: { id }, data: productData });
    }

    if (offerings) {
      await syncProductOfferings(tx, id, offerings);
    }
  });

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { where: { active: true }, orderBy: { presentation: "asc" } },
      documents: true,
    },
  });

  if (product) {
    await logUserActivity({
      userId: session.user.id,
      action: "PRODUCT_UPDATED",
      summary: `Actualizó producto «${product.name}»`,
      entityType: "product",
      entityId: product.id,
    });

    await notifyAdminsOfCatalogChange({
      type: "PRODUCT_UPDATED",
      summary: `Producto actualizado: ${product.name}`,
      detail: `Ref. Galvan: ${product.galvanReference}`,
      productId: product.id,
      actorUserId: session.user.id,
    });
  }

  return NextResponse.json(product);
}
