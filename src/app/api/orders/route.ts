import { NextRequest, NextResponse } from "next/server";
import {
  DestinationType,
  OrderStatus,
  Role,
  ShippingType,
} from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrdersForUser } from "@/lib/orders";
import {
  resolveShippingType,
} from "@/lib/shipping";
import { resolveShippingService } from "@/lib/shipping-rates";
import { orderTotalsFromLines } from "@/lib/pricing";
import { finalClientFieldsSchema } from "@/lib/final-client";
import { resolveOrderLines } from "@/lib/order-estimates";
import { generateOrderNumber, generateTrackingToken } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const orders = await getOrdersForUser(
    session.user.id,
    session.user.role,
    session.user.organizationId
  );

  return NextResponse.json(orders);
}

const lineSchema = z.object({
  variantId: z.string(),
  quantity: z.number().positive(),
});

const createOrderSchema = z
  .object({
    lines: z.array(lineSchema).min(1),
    destinationType: z.enum(["CLIENT_WAREHOUSE", "FINAL_CLIENT"]),
    destEmail: z.string().email().optional().or(z.literal("")),
    shippingServiceId: z.string().optional(),
  })
  .merge(finalClientFieldsSchema);

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!session.user.organizationId) {
    return NextResponse.json(
      { error: "Usuario sin organización" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const clientOrg = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });

  if (!clientOrg) {
    return NextResponse.json(
      { error: "Organización no encontrada" },
      { status: 400 }
    );
  }

  const variantIds = data.lines.map((l) => l.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds }, active: true },
    include: { product: true },
  });

  if (variants.length !== variantIds.length) {
    return NextResponse.json(
      { error: "Variante de producto no válida" },
      { status: 400 }
    );
  }

  const allVariants = await prisma.productVariant.findMany({
    where: { active: true },
    include: { product: true },
  });

  const fc = parsed.data;
  const fullName = `${fc.finalClientFirstName} ${fc.finalClientLastName}`.trim();

  let destName: string;
  let destStreet: string | null;
  let destCity: string | null;
  let destPostalCode: string | null;
  let destCountry: string;
  const destEmail = fc.finalClientEmail || fc.destEmail || null;

  if (data.destinationType === "CLIENT_WAREHOUSE") {
    destName = clientOrg.name;
    destStreet = clientOrg.street;
    destCity = clientOrg.city;
    destPostalCode = clientOrg.postalCode;
    destCountry = clientOrg.country;
  } else {
    destName = fullName;
    destStreet = fc.finalClientStreet;
    destCity = fc.finalClientCity;
    destPostalCode = fc.finalClientPostalCode;
    destCountry = fc.finalClientCountry;
  }

  const shippingType = resolveShippingType(destCountry);
  const shippingService = await resolveShippingService(
    data.shippingServiceId,
    shippingType
  );
  const shippingCostCents = shippingService.priceCents;

  const orderLines = resolveOrderLines(data.lines, allVariants);

  const { subtotalCents, vatCents, totalCents } = orderTotalsFromLines(
    orderLines,
    shippingCostCents
  );

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      clientOrgId: clientOrg.id,
      createdByUserId: session.user.id,
      status: OrderStatus.SENT,
      destinationType: data.destinationType as DestinationType,
      destName,
      destStreet,
      destCity,
      destPostalCode,
      destCountry,
      destEmail,
      finalClientFirstName: fc.finalClientFirstName,
      finalClientLastName: fc.finalClientLastName,
      finalClientStreet: fc.finalClientStreet,
      finalClientCity: fc.finalClientCity,
      finalClientPostalCode: fc.finalClientPostalCode,
      finalClientCountry: fc.finalClientCountry,
      finalClientPhone: fc.finalClientPhone,
      finalClientPhoneSecondary: fc.finalClientPhoneSecondary || null,
      finalClientEmail: fc.finalClientEmail || null,
      shippingType: shippingType as ShippingType,
      shippingCostCents,
      shippingServiceId:
        shippingService.id.startsWith("fallback") ? null : shippingService.id,
      shippingLabel: shippingService.label,
      subtotalCents,
      vatCents,
      totalCents,
      lines: {
        create: orderLines.map(({ vatRate: _vatRate, ...line }) => line),
      },
      statusEvents: {
        create: {
          status: OrderStatus.SENT,
          createdByUserId: session.user.id,
        },
      },
      trackingToken: {
        create: { token: generateTrackingToken() },
      },
    },
    include: {
      lines: { include: { variant: { include: { product: true } } } },
      statusEvents: true,
      trackingToken: true,
    },
  });

  return NextResponse.json(order, { status: 201 });
}
