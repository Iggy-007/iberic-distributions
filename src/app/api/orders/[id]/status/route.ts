import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, Role } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrderById } from "@/lib/orders";
import { NEXT_STATUS } from "@/lib/constants";
import { sendTrackingEmail } from "@/lib/email";
import {
  getOrderMissingActualsMessage,
  orderHasRequiredActuals,
} from "@/lib/line-actuals";
import { getMissingCarrierMessage, orderHasCarrierInfo } from "@/lib/carrier";

const statusSchema = z
  .object({
    status: z.enum([
      "SENT",
      "RECEIVED_BY_PROVIDER",
      "IN_PROCESS",
      "SHIPPED_TO_FINAL",
    ]),
    note: z.string().optional(),
    carrierCompany: z.string().optional(),
    carrierTrackingNumber: z.string().optional(),
    carrierPhone: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status !== "SHIPPED_TO_FINAL") return;
    if (!data.carrierCompany?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Empresa de transporte obligatoria",
        path: ["carrierCompany"],
      });
    }
    if (!data.carrierTrackingNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Número de seguimiento obligatorio",
        path: ["carrierTrackingNumber"],
      });
    }
    if (!data.carrierPhone?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Teléfono del transportista obligatorio",
        path: ["carrierPhone"],
      });
    }
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
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const newStatus = parsed.data.status as OrderStatus;
  const expectedNext = NEXT_STATUS[order.status];

  if (session.user.role === Role.PROVIDER) {
    if (order.status === OrderStatus.CANCELLED) {
      if (newStatus !== OrderStatus.SENT) {
        return NextResponse.json(
          { error: "Solo puede reactivar el pedido a «solicitado»" },
          { status: 400 }
        );
      }
    } else {
      if (newStatus !== expectedNext) {
        return NextResponse.json(
          { error: "Transición de estado no válida" },
          { status: 400 }
        );
      }

      if (!orderHasRequiredActuals(order.lines)) {
        return NextResponse.json(
          {
            error:
              getOrderMissingActualsMessage(order.lines) ??
              "Falta información obligatoria en el pedido",
          },
          { status: 400 }
        );
      }

      if (
        newStatus === OrderStatus.SHIPPED_TO_FINAL &&
        !orderHasCarrierInfo({
          carrierCompany: parsed.data.carrierCompany ?? null,
          carrierTrackingNumber: parsed.data.carrierTrackingNumber ?? null,
          carrierPhone: parsed.data.carrierPhone ?? null,
        })
      ) {
        return NextResponse.json(
          { error: getMissingCarrierMessage() },
          { status: 400 }
        );
      }
    }
  }

  const carrierUpdate =
    newStatus === OrderStatus.SHIPPED_TO_FINAL
      ? {
          carrierCompany: parsed.data.carrierCompany!.trim(),
          carrierTrackingNumber: parsed.data.carrierTrackingNumber!.trim(),
          carrierPhone: parsed.data.carrierPhone!.trim(),
        }
      : {};

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id },
      data: {
        status: newStatus,
        ...carrierUpdate,
        ...(order.status === OrderStatus.CANCELLED &&
        newStatus === OrderStatus.SENT
          ? { cancellationNumber: null }
          : {}),
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
        status: newStatus,
        note: parsed.data.note,
        createdByUserId: session.user.id,
      },
    });

    return o;
  });

  if (
    newStatus === OrderStatus.SHIPPED_TO_FINAL &&
    updated.destEmail &&
    updated.trackingToken
  ) {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    await sendTrackingEmail({
      to: updated.destEmail,
      orderNumber: updated.orderNumber,
      trackingUrl: `${baseUrl}/tracking/${updated.trackingToken.token}`,
      destinationCity: updated.destCity ?? "",
      carrierCompany: updated.carrierCompany ?? undefined,
      carrierTrackingNumber: updated.carrierTrackingNumber ?? undefined,
      carrierPhone: updated.carrierPhone ?? undefined,
    });
  }

  return NextResponse.json(updated);
}
