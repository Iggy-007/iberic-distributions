import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, Role } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrderById } from "@/lib/orders";
import { canCancelOrder } from "@/lib/order-groups";
import { generateCancellationNumber } from "@/lib/utils";

const cancelSchema = z.object({
  justification: z
    .string()
    .trim()
    .min(1, "La justificación es obligatoria"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (
    !session ||
    (session.user.role !== Role.CLIENT && session.user.role !== Role.PROVIDER)
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = cancelSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return NextResponse.json({ error: message }, { status: 400 });
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

  if (!canCancelOrder(order.status)) {
    return NextResponse.json(
      { error: "Este pedido ya no se puede cancelar" },
      { status: 400 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        cancellationNumber:
          order.cancellationNumber ?? generateCancellationNumber(),
      },
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

    await tx.orderStatusEvent.create({
      data: {
        orderId: id,
        status: OrderStatus.CANCELLED,
        note: parsed.data.justification,
        createdByUserId: session.user.id,
      },
    });

    return o;
  });

  return NextResponse.json(updated);
}
