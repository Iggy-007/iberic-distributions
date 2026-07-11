import { ShippingType } from "@prisma/client";
import {
  INTERNATIONAL_SHIPPING_CENTS,
  NATIONAL_SHIPPING_CENTS,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export interface ShippingRates {
  nationalCents: number;
  internationalCents: number;
  supplier: string;
}

const DEFAULT_RATES: ShippingRates = {
  nationalCents: NATIONAL_SHIPPING_CENTS,
  internationalCents: INTERNATIONAL_SHIPPING_CENTS,
  supplier: "",
};

export async function ensureDefaultShippingRates(): Promise<void> {
  await prisma.shippingRate.upsert({
    where: { type: ShippingType.NATIONAL },
    create: {
      type: ShippingType.NATIONAL,
      priceCents: NATIONAL_SHIPPING_CENTS,
      label: "Envío nacional (España)",
      supplier: "",
    },
    update: {},
  });
  await prisma.shippingRate.upsert({
    where: { type: ShippingType.INTERNATIONAL },
    create: {
      type: ShippingType.INTERNATIONAL,
      priceCents: INTERNATIONAL_SHIPPING_CENTS,
      label: "Envío internacional",
      supplier: "",
    },
    update: {},
  });
}

export async function getShippingRates(): Promise<ShippingRates> {
  try {
    const rows = await prisma.shippingRate.findMany();
    if (rows.length === 0) {
      await ensureDefaultShippingRates();
      return DEFAULT_RATES;
    }

    const national = rows.find((r) => r.type === ShippingType.NATIONAL);
    const international = rows.find(
      (r) => r.type === ShippingType.INTERNATIONAL
    );

    const supplier =
      national?.supplier?.trim() ||
      international?.supplier?.trim() ||
      "";

    return {
      nationalCents: national?.priceCents ?? NATIONAL_SHIPPING_CENTS,
      internationalCents:
        international?.priceCents ?? INTERNATIONAL_SHIPPING_CENTS,
      supplier,
    };
  } catch {
    return DEFAULT_RATES;
  }
}

export async function getShippingCostCentsFromDb(
  shippingType: ShippingType
): Promise<number> {
  const rates = await getShippingRates();
  return shippingType === ShippingType.NATIONAL
    ? rates.nationalCents
    : rates.internationalCents;
}

export async function updateShippingRates(input: {
  nationalCents: number;
  internationalCents: number;
  supplier?: string;
}): Promise<ShippingRates> {
  await ensureDefaultShippingRates();

  const supplier = input.supplier?.trim() ?? "";

  await prisma.$transaction([
    prisma.shippingRate.update({
      where: { type: ShippingType.NATIONAL },
      data: { priceCents: input.nationalCents, supplier },
    }),
    prisma.shippingRate.update({
      where: { type: ShippingType.INTERNATIONAL },
      data: { priceCents: input.internationalCents, supplier },
    }),
  ]);

  return getShippingRates();
}
