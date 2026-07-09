import type { PriceType } from "@prisma/client";
import { addVatCents } from "@/lib/pricing";
import { formatEuros } from "@/lib/shipping";
import {
  HAM_LONCHEADO_PACKAGES_PER_UNIT,
  HAM_PLATEADO_PLATES_PER_UNIT,
  LOMITO_KG_ESTIMATE,
  WHOLE_HAM_KG_ESTIMATE,
  getVariantKind,
  inferStoredLineUnits,
  resolveLineVatRate,
} from "@/lib/order-estimates";
import { calcVatCents } from "@/lib/pricing";

export interface VariantPriceInput {
  name: string;
  priceCents: number;
  priceType: PriceType;
  vatRate: number;
  unitLabel: string;
}

function formatKg(kg: number): string {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(kg);
}

export function calcEstimatedTotalWithVatCents(
  priceCents: number,
  vatRate: number,
  multiplier: number
): number {
  const unitWithVat = addVatCents(priceCents, vatRate);
  return Math.round(unitWithVat * multiplier);
}

export function formatEstimatedPriceFormula(
  priceCents: number,
  vatRate: number,
  perUnitSuffix: string,
  multiplier: number,
  multiplierLabel: string
): string {
  const unitWithVat = addVatCents(priceCents, vatRate);
  const total = Math.round(unitWithVat * multiplier);
  return `${formatEuros(unitWithVat)}${perUnitSuffix} × ${multiplierLabel} = ${formatEuros(total)} (precio estimado)`;
}

export function formatEstimatedPriceForUnits(
  variant: VariantPriceInput,
  units: number
): string | null {
  if (units <= 0) return null;

  const kind = getVariantKind(variant.name);

  switch (kind) {
    case "whole_ham": {
      const kg = WHOLE_HAM_KG_ESTIMATE * units;
      const kgLabel =
        units === 1
          ? `${formatKg(WHOLE_HAM_KG_ESTIMATE)} kg`
          : `${formatKg(WHOLE_HAM_KG_ESTIMATE)} kg × ${units} unid.`;
      return formatEstimatedPriceFormula(
        variant.priceCents,
        variant.vatRate,
        "/kg",
        kg,
        kgLabel
      );
    }
    case "ham_loncheado": {
      const packages = units * HAM_LONCHEADO_PACKAGES_PER_UNIT;
      const pkgLabel =
        units === 1
          ? `${HAM_LONCHEADO_PACKAGES_PER_UNIT} paquetes`
          : `${HAM_LONCHEADO_PACKAGES_PER_UNIT} paq. × ${units} unid.`;
      return formatEstimatedPriceFormula(
        variant.priceCents,
        variant.vatRate,
        "/paquete",
        packages,
        pkgLabel
      );
    }
    case "ham_plateado": {
      const plates = units * HAM_PLATEADO_PLATES_PER_UNIT;
      const plateLabel =
        units === 1
          ? `${HAM_PLATEADO_PLATES_PER_UNIT} platos`
          : `${HAM_PLATEADO_PLATES_PER_UNIT} platos × ${units} unid.`;
      return formatEstimatedPriceFormula(
        variant.priceCents,
        variant.vatRate,
        "/plato",
        plates,
        plateLabel
      );
    }
    case "lomito": {
      const kg = LOMITO_KG_ESTIMATE * units;
      const kgLabel =
        units === 1
          ? `${formatKg(LOMITO_KG_ESTIMATE)} kg`
          : `${formatKg(LOMITO_KG_ESTIMATE)} kg × ${units} unid.`;
      return formatEstimatedPriceFormula(
        variant.priceCents,
        variant.vatRate,
        "/kg",
        kg,
        kgLabel
      );
    }
    default:
      return null;
  }
}

/** Precio estimado por 1 unidad (catálogo) */
export function formatCatalogEstimatedPrice(
  variant: VariantPriceInput
): string | null {
  return formatEstimatedPriceForUnits(variant, 1);
}

export function calcEstimatedTotalForUnits(
  variant: VariantPriceInput,
  units: number
): number | null {
  const kind = getVariantKind(variant.name);
  if (units <= 0) return null;

  switch (kind) {
    case "whole_ham":
      return calcEstimatedTotalWithVatCents(
        variant.priceCents,
        variant.vatRate,
        WHOLE_HAM_KG_ESTIMATE * units
      );
    case "ham_loncheado":
      return calcEstimatedTotalWithVatCents(
        variant.priceCents,
        variant.vatRate,
        units * HAM_LONCHEADO_PACKAGES_PER_UNIT
      );
    case "ham_plateado":
      return calcEstimatedTotalWithVatCents(
        variant.priceCents,
        variant.vatRate,
        units * HAM_PLATEADO_PLATES_PER_UNIT
      );
    case "lomito":
      return calcEstimatedTotalWithVatCents(
        variant.priceCents,
        variant.vatRate,
        LOMITO_KG_ESTIMATE * units
      );
    default:
      return null;
  }
}

export function formatOrderLineEstimatedPrice(line: {
  quantity: number;
  lineTotalCents: number;
  variant: VariantPriceInput;
}): {
  formula: string;
  subtotalCents: number;
  vatCents: number;
  totalWithVatCents: number;
} | null {
  const kind = getVariantKind(line.variant.name);
  if (kind === "other") return null;

  const units = inferStoredLineUnits({
    quantity: line.quantity,
    variant: line.variant,
  });
  const formula = formatEstimatedPriceForUnits(line.variant, units);
  if (!formula) return null;

  const vatRate = resolveLineVatRate(line.variant.name, line.variant.vatRate);
  const vatCents = calcVatCents(line.lineTotalCents, vatRate);

  return {
    formula,
    subtotalCents: line.lineTotalCents,
    vatCents,
    totalWithVatCents: line.lineTotalCents + vatCents,
  };
}

export function orderHasEstimatedLines(
  lines: { variant: { name: string } }[]
): boolean {
  return lines.some((l) => getVariantKind(l.variant.name) !== "other");
}
