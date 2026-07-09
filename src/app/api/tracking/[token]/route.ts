import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import {
  calcOrderVatCentsFromLines,
  formatOrderVatLabel,
} from "@/lib/pricing";
import { formatEuros } from "@/lib/shipping";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const tracking = await prisma.trackingToken.findUnique({
    where: { token },
    include: {
      order: {
        include: {
          lines: {
            include: { variant: { include: { product: true } } },
          },
          statusEvents: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!tracking) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (tracking.expiresAt && tracking.expiresAt < new Date()) {
    return NextResponse.json({ error: "Enlace expirado" }, { status: 410 });
  }

  const order = tracking.order;
  const lineVatInputs = order.lines.map((line) => ({
    lineTotalCents: line.lineTotalCents,
    vatRate: line.variant.vatRate,
  }));
  const vatCents =
    order.vatCents > 0
      ? order.vatCents
      : calcOrderVatCentsFromLines(lineVatInputs);
  const totalCents =
    order.vatCents > 0
      ? order.totalCents
      : order.subtotalCents + vatCents + order.shippingCostCents;

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status],
    destinationCity: order.destCity,
    destinationCountry: order.destCountry,
    products: order.lines.map((l) => ({
      name: `${l.variant.product.name} — ${l.variant.name}`,
      quantity: l.quantity,
    })),
    subtotal: formatEuros(order.subtotalCents),
    vat: formatEuros(vatCents),
    vatLabel: formatOrderVatLabel(lineVatInputs),
    shipping: formatEuros(order.shippingCostCents),
    total: formatEuros(totalCents),
    timeline: order.statusEvents.map((e) => ({
      status: e.status,
      label: ORDER_STATUS_LABELS[e.status],
      date: e.createdAt,
    })),
    carrier:
      order.carrierCompany ||
      order.carrierTrackingNumber ||
      order.carrierPhone
        ? {
            company: order.carrierCompany,
            trackingNumber: order.carrierTrackingNumber,
            phone: order.carrierPhone,
          }
        : null,
  });
}
