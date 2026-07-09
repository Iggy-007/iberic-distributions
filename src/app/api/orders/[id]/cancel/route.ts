import { NextResponse } from "next/server";
import { OrderStatus, Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrderById } from "@/lib/orders";
import { canClientCancelOrder } from "@/lib/order-groups";
import { generateCancellationNumber } from "@/lib/utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

  if (!canClientCancelOrder(order.status)) {
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
        createdByUserId: session.user.id,
      },
    });

    return o;
  });

  return NextResponse.json(updated);
}
