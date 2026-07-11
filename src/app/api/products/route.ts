import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCatalog } from "@/lib/catalog-permissions";
import { notifyAdminsOfCatalogChange } from "@/lib/catalog-notifications";
import { logUserActivity } from "@/lib/user-activity";
import { createProductWithOfferingsSchema } from "@/lib/product-offerings-schema";
import { syncProductOfferings } from "@/lib/product-variant-sync";
import { sortVariantsByPresentation } from "@/lib/product-presentations";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      variants: { where: { active: true }, orderBy: { presentation: "asc" } },
      documents: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    products.map((product) => ({
      ...product,
      variants: sortVariantsByPresentation(product.variants),
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !canManageCatalog(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createProductWithOfferingsSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name: parsed.data.name,
        galvanReference: parsed.data.galvanReference.trim(),
        description: parsed.data.description?.trim() || null,
      },
    });

    await syncProductOfferings(tx, created.id, parsed.data.offerings);

    return tx.product.findUnique({
      where: { id: created.id },
      include: {
        variants: { where: { active: true }, orderBy: { presentation: "asc" } },
        documents: true,
      },
    });
  });

  if (!product) {
    return NextResponse.json({ error: "No se pudo crear el producto" }, { status: 500 });
  }

  const services = [
    parsed.data.offerings.loncheado?.enabled ? "loncheado" : null,
    parsed.data.offerings.plateado?.enabled ? "plateado" : null,
  ]
    .filter(Boolean)
    .join(", ");

  await logUserActivity({
    userId: session.user.id,
    action: "PRODUCT_CREATED",
    summary: `Creó producto «${product.name}»`,
    detail: `Ref. Galvan: ${product.galvanReference}${services ? ` · Servicios: ${services}` : ""}`,
    entityType: "product",
    entityId: product.id,
  });

  await notifyAdminsOfCatalogChange({
    type: "PRODUCT_CREATED",
    summary: `Nuevo producto: ${product.name}`,
    detail: `Ref. Galvan: ${product.galvanReference}${services ? `\nServicios: ${services}` : ""}`,
    productId: product.id,
    actorUserId: session.user.id,
  });

  return NextResponse.json(product, { status: 201 });
}
