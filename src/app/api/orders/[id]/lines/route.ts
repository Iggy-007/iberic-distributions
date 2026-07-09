import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrderById } from "@/lib/orders";
import {
  calcLineTotalFromActuals,
  calcOrderTotalsFromActuals,
  getLineActualFields,
} from "@/lib/line-actuals";

const lineUpdateSchema = z.object({
  lines: z
    .array(
      z.object({
        lineId: z.string(),
        actualWeightKg: z.number().positive().optional().nullable(),
        actualPieceCount: z.number().positive().optional().nullable(),
        galvanInternalId: z.string().max(100).optional().nullable(),
      })
    )
    .min(1),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const allowedRoles: Role[] = [Role.PROVIDER, Role.ADMIN];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const { id } = await params;
  const order = await getOrderById(
    id,
    session.user.id,
    session.user.role,
    session.user.organizationId
  );

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = lineUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  for (const update of parsed.data.lines) {
    const line = order.lines.find((l) => l.id === update.lineId);
    if (!line) {
      return NextResponse.json(
        { error: "Línea de pedido no encontrada" },
        { status: 400 }
      );
    }

    const fields = getLineActualFields(line.variant.name);
    if (fields.weight && update.actualWeightKg == null) {
      return NextResponse.json(
        { error: `Peso real del jamón obligatorio para ${line.variant.name}` },
        { status: 400 }
      );
    }
    if (fields.pieces && update.actualPieceCount == null) {
      return NextResponse.json(
        {
          error: `Paquetes o platos reales obligatorios para ${line.variant.name}`,
        },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    for (const update of parsed.data.lines) {
      const line = order.lines.find((l) => l.id === update.lineId)!;
      const actualWeightKg =
        update.actualWeightKg !== undefined
          ? update.actualWeightKg
          : line.actualWeightKg;
      const actualPieceCount =
        update.actualPieceCount !== undefined
          ? update.actualPieceCount
          : line.actualPieceCount;
      const galvanInternalId =
        update.galvanInternalId !== undefined
          ? update.galvanInternalId?.trim() || null
          : line.galvanInternalId;

      const lineForCalc = {
        ...line,
        actualWeightKg,
        actualPieceCount,
        variant: line.variant,
      };

      await tx.orderLine.update({
        where: { id: update.lineId },
        data: {
          actualWeightKg,
          actualPieceCount,
          galvanInternalId,
          lineTotalCents: calcLineTotalFromActuals(lineForCalc),
        },
      });
    }

    const freshLines = await tx.orderLine.findMany({
      where: { orderId: id },
      include: { variant: true },
    });

    const totals = calcOrderTotalsFromActuals(
      freshLines,
      order.shippingCostCents
    );

    return tx.order.update({
      where: { id },
      data: totals,
      include: {
        lines: { include: { variant: { include: { product: true } } } },
        statusEvents: {
          orderBy: { createdAt: "asc" },
          include: { createdBy: { select: { name: true } } },
        },
        trackingToken: true,
        clientOrg: true,
      },
    });
  });

  return NextResponse.json(updated);
}
