import type { PriceType, VariantPresentation } from "@prisma/client";
import { calcVatCents } from "./pricing";
import { formatEstimatedPriceForUnits } from "./estimated-prices";

/** Rango de peso por jamón entero (kg) */
export const WHOLE_HAM_KG_MIN = 7;
export const WHOLE_HAM_KG_MAX = 7.5;
/** Kg usados para estimar el precio (tope del rango) */
export const WHOLE_HAM_KG_ESTIMATE = WHOLE_HAM_KG_MAX;
/** Paquetes loncheado estimados por unidad pedida de jamón loncheado */
export const HAM_LONCHEADO_PACKAGES_PER_UNIT = 30;
/** Platos estimados por unidad pedida de jamón plateado */
export const HAM_PLATEADO_PLATES_PER_UNIT = 30;
/** Kg estimados por unidad de lomito (400 g; cobro por kg) */
export const LOMITO_KG_ESTIMATE = 0.4;

export function formatLomitoWeightLabel(kg: number = LOMITO_KG_ESTIMATE): string {
  const grams = Math.round(kg * 1000);
  return `${grams} g`;
}

export type VariantKind =
  | "whole_ham"
  | "ham_loncheado"
  | "ham_plateado"
  | "lomito"
  | "lomito_loncheado"
  | "other";

export interface VariantForEstimate {
  id: string;
  name: string;
  unitLabel: string;
  priceCents: number;
  priceType: PriceType;
  vatRate: number;
  presentation?: VariantPresentation;
  product: { name: string };
}

export interface CartLineInput {
  variantId: string;
  quantity: number;
}

export interface EstimateLineItem {
  key: string;
  productName: string;
  variantName: string;
  quantityLabel: string;
  priceFormula: string | null;
  subtotalCents: number;
  vatCents: number;
  totalWithVatCents: number;
  vatRate: number;
  isEstimated: boolean;
}

export interface OrderEstimate {
  lines: EstimateLineItem[];
  subtotalCents: number;
  vatCents: number;
  subtotalWithVatCents: number;
}

export interface ResolvedOrderLine {
  variantId: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  vatRate: number;
}

export function getVariantKind(
  variantName: string,
  productName?: string,
  presentation?: VariantPresentation | null
): VariantKind {
  if (presentation) {
    const product = productName?.toLowerCase() ?? "";
    if (presentation === "PLATEADO") return "ham_plateado";
    if (presentation === "LONCHEADO") {
      return product.includes("lomito") ? "lomito_loncheado" : "ham_loncheado";
    }
    if (presentation === "BASE") {
      if (product.includes("jamón") || product.includes("jamon")) {
        return "whole_ham";
      }
      if (product.includes("lomito")) return "lomito";
      return "other";
    }
  }

  const legacy = getVariantKindFromLegacyName(variantName);
  if (legacy) return legacy;

  const product = productName?.toLowerCase() ?? "";
  const variant = variantName.toLowerCase().trim();

  if (product.includes("jamón") || product.includes("jamon")) {
    if (variant === "entero") return "whole_ham";
    if (variant === "loncheado") return "ham_loncheado";
    if (variant === "plateado") return "ham_plateado";
  }

  if (product.includes("lomito")) {
    if (variant === "entero") return "lomito";
    if (variant === "loncheado") return "lomito_loncheado";
  }

  return "other";
}

function getVariantKindFromLegacyName(name: string): VariantKind | null {
  if (name === "Jamón entero") return "whole_ham";
  if (name === "Jamón loncheado") return "ham_loncheado";
  if (name === "Jamón plateado") return "ham_plateado";
  if (name === "Lomito ibérico loncheado") return "lomito_loncheado";
  if (name === "Lomito ibérico") return "lomito";
  return null;
}

export function formatWholeHamWeightLabel(units: number): string {
  const n = Math.round(units);
  if (n === 1) {
    return "1 unid. (7–7,5 kg, precio estimado)";
  }
  return `${n} unid. (7–7,5 kg c/u, precio estimado)`;
}

export function getVariantOrderHint(kind: VariantKind): string | null {
  switch (kind) {
    case "whole_ham":
      return "Peso entre 7 y 7,5 kg por unidad — precio estimado";
    case "ham_loncheado":
      return `~${HAM_LONCHEADO_PACKAGES_PER_UNIT} paquetes por unidad (estimado)`;
    case "ham_plateado":
      return `~${HAM_PLATEADO_PLATES_PER_UNIT} platos por unidad (estimado)`;
    case "lomito":
      return `~${formatLomitoWeightLabel()} por unidad (cobro por kg estimado)`;
    default:
      return null;
  }
}

function billedKgLineTotal(
  priceCentsPerKg: number,
  units: number,
  kgPerUnit: number
): number {
  return Math.round(priceCentsPerKg * units * kgPerUnit);
}

function fixedLineTotal(priceCents: number, units: number): number {
  return priceCents * Math.round(units);
}

function pushEstimateLine(
  lines: EstimateLineItem[],
  vatInputs: { lineTotalCents: number; vatRate: number }[],
  item: Omit<EstimateLineItem, "totalWithVatCents" | "vatCents"> & {
    subtotalCents: number;
  }
) {
  const vatCents = calcVatCents(item.subtotalCents, item.vatRate);
  const totalWithVatCents = item.subtotalCents + vatCents;
  lines.push({ ...item, vatCents, totalWithVatCents });
  vatInputs.push({ lineTotalCents: item.subtotalCents, vatRate: item.vatRate });
}

export function buildOrderEstimate(
  cart: CartLineInput[],
  allVariants: VariantForEstimate[]
): OrderEstimate {
  const lines: EstimateLineItem[] = [];
  const vatInputs: { lineTotalCents: number; vatRate: number }[] = [];

  for (const cartLine of cart) {
    const variant = allVariants.find((v) => v.id === cartLine.variantId);
    if (!variant || cartLine.quantity <= 0) continue;

    const units = Math.round(cartLine.quantity);
    const kind = getVariantKind(
      variant.name,
      variant.product.name,
      variant.presentation
    );

    if (kind === "whole_ham") {
      const hamSubtotal = billedKgLineTotal(
        variant.priceCents,
        units,
        WHOLE_HAM_KG_ESTIMATE
      );

      pushEstimateLine(lines, vatInputs, {
        key: `${variant.id}-ham`,
        productName: variant.product.name,
        variantName: variant.name,
        quantityLabel: formatWholeHamWeightLabel(units),
        priceFormula: formatEstimatedPriceForUnits(variant, units),
        subtotalCents: hamSubtotal,
        vatRate: 0.1,
        isEstimated: true,
      });
      continue;
    }

    if (kind === "ham_loncheado") {
      const packages = units * HAM_LONCHEADO_PACKAGES_PER_UNIT;
      const subtotal = fixedLineTotal(variant.priceCents, packages);

      pushEstimateLine(lines, vatInputs, {
        key: variant.id,
        productName: variant.product.name,
        variantName: variant.name,
        quantityLabel: `${units} unid. (~${packages} paquetes)`,
        priceFormula: formatEstimatedPriceForUnits(variant, units),
        subtotalCents: subtotal,
        vatRate: variant.vatRate,
        isEstimated: true,
      });
      continue;
    }

    if (kind === "ham_plateado") {
      const plates = units * HAM_PLATEADO_PLATES_PER_UNIT;
      const subtotal = fixedLineTotal(variant.priceCents, plates);

      pushEstimateLine(lines, vatInputs, {
        key: variant.id,
        productName: variant.product.name,
        variantName: variant.name,
        quantityLabel: `${units} unid. (~${plates} platos)`,
        priceFormula: formatEstimatedPriceForUnits(variant, units),
        subtotalCents: subtotal,
        vatRate: variant.vatRate,
        isEstimated: true,
      });
      continue;
    }

    if (kind === "lomito") {
      const kg = units * LOMITO_KG_ESTIMATE;
      const subtotal = billedKgLineTotal(
        variant.priceCents,
        units,
        LOMITO_KG_ESTIMATE
      );

      pushEstimateLine(lines, vatInputs, {
        key: variant.id,
        productName: variant.product.name,
        variantName: variant.name,
        quantityLabel: `${units} unid. (~${kg} kg)`,
        priceFormula: formatEstimatedPriceForUnits(variant, units),
        subtotalCents: subtotal,
        vatRate: variant.vatRate,
        isEstimated: true,
      });
      continue;
    }

    const subtotal =
      variant.priceType === "PER_KG"
        ? billedKgLineTotal(variant.priceCents, units, 1)
        : fixedLineTotal(variant.priceCents, units);

    pushEstimateLine(lines, vatInputs, {
      key: variant.id,
      productName: variant.product.name,
      variantName: variant.name,
      quantityLabel: `${units} ${variant.unitLabel}`,
      priceFormula: null,
      subtotalCents: subtotal,
      vatRate: variant.vatRate,
      isEstimated: false,
    });
  }

  const subtotalCents = vatInputs.reduce((s, l) => s + l.lineTotalCents, 0);
  const vatCents = vatInputs.reduce(
    (s, l) => s + calcVatCents(l.lineTotalCents, l.vatRate),
    0
  );

  return {
    lines,
    subtotalCents,
    vatCents,
    subtotalWithVatCents: subtotalCents + vatCents,
  };
}

/** Líneas de pedido persistidas según unidades y estimaciones */
export function resolveOrderLines(
  cart: CartLineInput[],
  allVariants: VariantForEstimate[]
): ResolvedOrderLine[] {
  const result: ResolvedOrderLine[] = [];

  for (const cartLine of cart) {
    const variant = allVariants.find((v) => v.id === cartLine.variantId);
    if (!variant || cartLine.quantity <= 0) continue;

    const units = Math.round(cartLine.quantity);
    const kind = getVariantKind(
      variant.name,
      variant.product.name,
      variant.presentation
    );

    if (kind === "whole_ham") {
      result.push({
        variantId: variant.id,
        quantity: units,
        unitPriceCents: variant.priceCents,
        lineTotalCents: billedKgLineTotal(
          variant.priceCents,
          units,
          WHOLE_HAM_KG_ESTIMATE
        ),
        vatRate: 0.1,
      });
      continue;
    }

    if (kind === "ham_loncheado") {
      const packages = units * HAM_LONCHEADO_PACKAGES_PER_UNIT;
      result.push({
        variantId: variant.id,
        quantity: packages,
        unitPriceCents: variant.priceCents,
        lineTotalCents: fixedLineTotal(variant.priceCents, packages),
        vatRate: variant.vatRate,
      });
      continue;
    }

    if (kind === "ham_plateado") {
      const plates = units * HAM_PLATEADO_PLATES_PER_UNIT;
      result.push({
        variantId: variant.id,
        quantity: plates,
        unitPriceCents: variant.priceCents,
        lineTotalCents: fixedLineTotal(variant.priceCents, plates),
        vatRate: variant.vatRate,
      });
      continue;
    }

    if (kind === "lomito") {
      result.push({
        variantId: variant.id,
        quantity: units,
        unitPriceCents: variant.priceCents,
        lineTotalCents: billedKgLineTotal(
          variant.priceCents,
          units,
          LOMITO_KG_ESTIMATE
        ),
        vatRate: variant.vatRate,
      });
      continue;
    }

    const lineTotalCents =
      variant.priceType === "PER_KG"
        ? billedKgLineTotal(variant.priceCents, units, 1)
        : fixedLineTotal(variant.priceCents, units);

    result.push({
      variantId: variant.id,
      quantity: units,
      unitPriceCents: variant.priceCents,
      lineTotalCents,
      vatRate: variant.vatRate,
    });
  }

  return result;
}

export function resolveLineVatRate(
  variantName: string,
  vatRate: number,
  productName?: string,
  presentation?: VariantPresentation | null
): number {
  return getVariantKind(variantName, productName, presentation) === "whole_ham"
    ? 0.1
    : vatRate;
}

export interface StoredOrderLine {
  id?: string;
  quantity: number;
  lineTotalCents: number;
  variant: VariantForEstimate & {
    product: { name: string };
    presentation?: VariantPresentation;
  };
}

/** Infers ordered units from persisted line quantities (supports legacy kg orders). */
export function inferStoredLineUnits(line: {
  quantity: number;
  variant: Pick<VariantForEstimate, "name" | "unitLabel"> & {
    product?: { name: string };
    presentation?: VariantPresentation;
  };
}): number {
  const kind = getVariantKind(
    line.variant.name,
    line.variant.product?.name,
    line.variant.presentation
  );
  const q = line.quantity;

  switch (kind) {
    case "whole_ham":
    case "lomito":
      if (
        line.variant.unitLabel === "unidad" &&
        q <= 100 &&
        Math.abs(q - Math.round(q)) < 0.01
      ) {
        return Math.max(1, Math.round(q));
      }
      return 1;
    case "ham_loncheado":
      if (q > HAM_LONCHEADO_PACKAGES_PER_UNIT) {
        return Math.max(1, Math.round(q / HAM_LONCHEADO_PACKAGES_PER_UNIT));
      }
      return Math.max(1, Math.round(q));
    case "ham_plateado":
      if (q > HAM_PLATEADO_PLATES_PER_UNIT) {
        return Math.max(1, Math.round(q / HAM_PLATEADO_PLATES_PER_UNIT));
      }
      return Math.max(1, Math.round(q));
    default:
      return Math.max(1, Math.round(q));
  }
}

function storedLineQuantityLabel(line: StoredOrderLine): string {
  const kind = getVariantKind(line.variant.name, line.variant.product.name);
  const units = inferStoredLineUnits(line);

  switch (kind) {
    case "whole_ham":
      return formatWholeHamWeightLabel(units);
    case "ham_loncheado": {
      const packages =
        line.quantity > HAM_LONCHEADO_PACKAGES_PER_UNIT
          ? Math.round(line.quantity)
          : units * HAM_LONCHEADO_PACKAGES_PER_UNIT;
      return `${units} unid. (~${packages} paquetes)`;
    }
    case "ham_plateado": {
      const plates =
        line.quantity > HAM_PLATEADO_PLATES_PER_UNIT
          ? Math.round(line.quantity)
          : units * HAM_PLATEADO_PLATES_PER_UNIT;
      return `${units} unid. (~${plates} platos)`;
    }
    case "lomito": {
      const grams = Math.round(units * LOMITO_KG_ESTIMATE * 1000);
      return `${units} unid. (~${grams} g)`;
    }
    default:
      return `${Math.round(line.quantity)} ${line.variant.unitLabel}`;
  }
}

/** Rebuilds estimated totals from persisted order lines for display. */
export function buildStoredOrderEstimate(
  lines: StoredOrderLine[]
): OrderEstimate {
  const estimateLines: EstimateLineItem[] = [];
  const vatInputs: { lineTotalCents: number; vatRate: number }[] = [];

  for (const line of lines) {
    const kind = getVariantKind(line.variant.name, line.variant.product.name);
    const vatRate = resolveLineVatRate(
      line.variant.name,
      line.variant.vatRate,
      line.variant.product.name,
      line.variant.presentation
    );
    const units = inferStoredLineUnits(line);
    const priceFormula =
      kind === "other"
        ? null
        : formatEstimatedPriceForUnits(line.variant, units);

    pushEstimateLine(estimateLines, vatInputs, {
      key: line.id ?? line.variant.id,
      productName: line.variant.product.name,
      variantName: line.variant.name,
      quantityLabel: storedLineQuantityLabel(line),
      priceFormula,
      subtotalCents: line.lineTotalCents,
      vatRate,
      isEstimated: kind !== "other",
    });
  }

  const subtotalCents = vatInputs.reduce((s, l) => s + l.lineTotalCents, 0);
  const vatCents = vatInputs.reduce(
    (s, l) => s + calcVatCents(l.lineTotalCents, l.vatRate),
    0
  );

  return {
    lines: estimateLines,
    subtotalCents,
    vatCents,
    subtotalWithVatCents: subtotalCents + vatCents,
  };
}
