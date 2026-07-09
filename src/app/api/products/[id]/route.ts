import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  unitLabel: z.string(),
  priceCents: z.number().int().min(0),
  priceType: z.enum(["FIXED", "PER_KG"]).optional(),
  vatRate: z.number().min(0).max(1).optional(),
  active: z.boolean().default(true),
});

const updateProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { variants, ...productData } = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (Object.keys(productData).length > 0) {
      await tx.product.update({ where: { id }, data: productData });
    }

    if (variants) {
      for (const v of variants) {
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              name: v.name,
              unitLabel: v.unitLabel,
              priceCents: v.priceCents,
              priceType: v.priceType,
              vatRate: v.vatRate,
              active: v.active,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: id,
              name: v.name,
              unitLabel: v.unitLabel,
              priceCents: v.priceCents,
              active: v.active,
            },
          });
        }
      }
    }
  });

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true, documents: true },
  });

  return NextResponse.json(product);
}
