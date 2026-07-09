import type { PriceType } from "@prisma/client";
import { VAT_RATE } from "./constants";
import {
  LOMITO_KG_ESTIMATE,
  formatWholeHamWeightLabel,
} from "./order-estimates";
import { formatEuros } from "./shipping";

export interface VariantPricing {
  priceCents: number;
  unitLabel: string;
  priceType: PriceType;
  vatRate?: number;
}

function resolveVatRate(rate?: number): number {
  return rate ?? VAT_RATE;
}

export function formatVatPercentLabel(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function calcVatCents(baseCents: number, rate: number = VAT_RATE): number {
  return Math.round(baseCents * rate);
}

export function addVatCents(
  baseCents: number,
  rate: number = VAT_RATE
): number {
  return baseCents + calcVatCents(baseCents, rate);
}

export function formatVariantPrice(variant: VariantPricing): string {
  const rate = resolveVatRate(variant.vatRate);
  const base = formatEuros(variant.priceCents);
  const withVat = formatEuros(addVatCents(variant.priceCents, rate));
  const vatLabel = formatVatPercentLabel(rate);

  if (variant.priceType === "PER_KG") {
    return `${withVat}/kg (IVA ${vatLabel} incl.) — pedido por unidades`;
  }
  return `${withVat}/${variant.unitLabel} (IVA ${vatLabel} incl.)`;
}

export function formatVariantPriceDetail(variant: VariantPricing): string {
  const rate = resolveVatRate(variant.vatRate);
  const base = formatEuros(variant.priceCents);
  const withVat = formatEuros(addVatCents(variant.priceCents, rate));
  const vatLabel = formatVatPercentLabel(rate);

  if (variant.priceType === "PER_KG") {
    return `${base}/kg + IVA ${vatLabel} = ${withVat}/kg`;
  }
  return `${base}/${variant.unitLabel} + IVA ${vatLabel} = ${withVat}`;
}

export function calcLineTotalCents(
  priceCents: number,
  quantity: number,
  priceType: PriceType
): number {
  if (priceType === "PER_KG") {
    return Math.round(priceCents * quantity);
  }
  return priceCents * Math.round(quantity);
}

export function calcLineTotalWithVatCents(
  priceCents: number,
  quantity: number,
  priceType: PriceType,
  vatRate: number = VAT_RATE
): number {
  return addVatCents(
    calcLineTotalCents(priceCents, quantity, priceType),
    vatRate
  );
}

export function formatQuantity(
  quantity: number,
  unitLabel: string,
  priceType: PriceType,
  variantName?: string
): string {
  if (priceType === "PER_KG" && unitLabel === "unidad") {
    const units = Math.round(quantity);
    if (variantName === "Jamón entero") {
      return formatWholeHamWeightLabel(units);
    }
    const kgEstimate =
      variantName === "Lomito ibérico"
        ? units * LOMITO_KG_ESTIMATE
        : quantity;
    const kgFormatted = new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(kgEstimate);
    return `${units} unid. (~${kgFormatted} kg)`;
  }
  if (priceType === "PER_KG") {
    const formatted = new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(quantity);
    return `${formatted} kg`;
  }
  return `${Math.round(quantity)} ${unitLabel}`;
}

export interface OrderLineVatInput {
  lineTotalCents: number;
  vatRate: number;
}

export function calcOrderVatCentsFromLines(lines: OrderLineVatInput[]): number {
  return lines.reduce(
    (sum, line) => sum + calcVatCents(line.lineTotalCents, line.vatRate),
    0
  );
}

export function formatOrderVatLabel(lines: { vatRate: number }[]): string {
  const rates = [...new Set(lines.map((line) => line.vatRate))];
  if (rates.length === 1) {
    return `IVA (${formatVatPercentLabel(rates[0])})`;
  }
  return "IVA";
}

export function orderTotalsFromLines(
  lines: OrderLineVatInput[],
  shippingCostCents: number
) {
  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const vatCents = calcOrderVatCentsFromLines(lines);
  const totalCents = subtotalCents + vatCents + shippingCostCents;
  return { subtotalCents, vatCents, totalCents };
}
