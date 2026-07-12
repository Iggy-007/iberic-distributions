import {
  PriceType,
  VariantPresentation,
  type ProductVariant,
} from "@prisma/client";

export const PRESENTATION_ORDER: VariantPresentation[] = [
  VariantPresentation.BASE,
  VariantPresentation.LONCHEADO,
  VariantPresentation.PLATEADO,
];

export function presentationLabel(presentation: VariantPresentation): string {
  switch (presentation) {
    case VariantPresentation.BASE:
      return "Entero";
    case VariantPresentation.LONCHEADO:
      return "Loncheado (sobres)";
    case VariantPresentation.PLATEADO:
      return "Plateado";
  }
}

export function presentationShortLabel(
  presentation: VariantPresentation
): string {
  switch (presentation) {
    case VariantPresentation.BASE:
      return "Entero";
    case VariantPresentation.LONCHEADO:
      return "Loncheado";
    case VariantPresentation.PLATEADO:
      return "Plateado";
  }
}

export function isServicePresentation(
  presentation: VariantPresentation
): boolean {
  return presentation !== VariantPresentation.BASE;
}

/** Etiqueta corta junto al campo de cantidad al crear pedidos */
export function orderQuantityUnitShort(
  presentation?: VariantPresentation | null
): string {
  return isServicePresentation(presentation ?? VariantPresentation.BASE)
    ? "servicio"
    : "unidad";
}

/** Cantidad abreviada en resúmenes de pedido (p. ej. "2 serv.") */
export function formatOrderQuantityAbbrev(
  count: number,
  presentation?: VariantPresentation | null
): string {
  const short = isServicePresentation(presentation ?? VariantPresentation.BASE)
    ? "serv."
    : "unid.";
  return `${count} ${short}`;
}

export function inferPresentationFromVariantName(
  name: string
): VariantPresentation {
  const normalized = name.toLowerCase().trim();
  if (
    normalized.includes("loncheado") ||
    normalized.includes("sobre")
  ) {
    return VariantPresentation.LONCHEADO;
  }
  if (normalized.includes("plateado")) {
    return VariantPresentation.PLATEADO;
  }
  return VariantPresentation.BASE;
}

export function resolveVariantPresentation(
  variant: Pick<ProductVariant, "name" | "presentation">
): VariantPresentation {
  return variant.presentation ?? inferPresentationFromVariantName(variant.name);
}

export interface OfferingInput {
  id?: string;
  enabled?: boolean;
  priceCents: number;
  vatRate: number;
  priceType?: PriceType;
  unitLabel?: string;
  galvanReference?: string;
}

export interface ProductOfferingsInput {
  base: OfferingInput;
  loncheado?: OfferingInput & { enabled: boolean };
  plateado?: OfferingInput & { enabled: boolean };
}

export interface ProductOfferingsState {
  base: {
    id?: string;
    priceEuros: string;
    vatPercent: string;
    priceType: PriceType;
  };
  loncheado: {
    id?: string;
    enabled: boolean;
    priceEuros: string;
    vatPercent: string;
    galvanReference: string;
  };
  plateado: {
    id?: string;
    enabled: boolean;
    priceEuros: string;
    vatPercent: string;
    galvanReference: string;
  };
}

export const DEFAULT_CREATE_OFFERINGS: ProductOfferingsState = {
  base: { priceEuros: "", vatPercent: "10", priceType: PriceType.PER_KG },
  loncheado: {
    enabled: false,
    priceEuros: "",
    vatPercent: "21",
    galvanReference: "",
  },
  plateado: {
    enabled: false,
    priceEuros: "",
    vatPercent: "21",
    galvanReference: "",
  },
};

export function sortVariantsByPresentation<
  T extends { presentation?: VariantPresentation },
>(variants: T[]): T[] {
  return [...variants].sort(
    (a, b) =>
      PRESENTATION_ORDER.indexOf(a.presentation ?? VariantPresentation.BASE) -
      PRESENTATION_ORDER.indexOf(b.presentation ?? VariantPresentation.BASE)
  );
}

export function eurosToCents(value: string): number | null {
  const cents = Math.round(parseFloat(value.replace(",", ".")) * 100);
  if (Number.isNaN(cents) || cents < 0) return null;
  return cents;
}

export function centsToEurosInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function percentToRate(value: string): number | null {
  const pct = parseFloat(value.replace(",", "."));
  if (Number.isNaN(pct) || pct < 0 || pct > 100) return null;
  return pct / 100;
}

export function rateToPercentInput(rate: number): string {
  return String(Math.round(rate * 10000) / 100);
}

export function variantsToOfferingsState(
  variants: Array<
    Pick<
      ProductVariant,
      "id" | "name" | "presentation" | "priceCents" | "vatRate" | "priceType" | "galvanReference"
    > & { active?: boolean }
  >
): ProductOfferingsState {
  const active = variants.filter((variant) => variant.active !== false);
  const base =
    active.find((v) => v.presentation === VariantPresentation.BASE) ??
    active.find((v) => resolveVariantPresentation(v) === VariantPresentation.BASE);
  const loncheado = active.find(
    (v) => v.presentation === VariantPresentation.LONCHEADO
  );
  const plateado = active.find(
    (v) => v.presentation === VariantPresentation.PLATEADO
  );

  return {
    base: {
      id: base?.id,
      priceEuros: base ? centsToEurosInput(base.priceCents) : "",
      vatPercent: base ? rateToPercentInput(base.vatRate) : "10",
      priceType: base?.priceType ?? PriceType.PER_KG,
    },
    loncheado: {
      id: loncheado?.id,
      enabled: Boolean(loncheado),
      priceEuros: loncheado ? centsToEurosInput(loncheado.priceCents) : "",
      vatPercent: loncheado ? rateToPercentInput(loncheado.vatRate) : "21",
      galvanReference: loncheado?.galvanReference ?? "",
    },
    plateado: {
      id: plateado?.id,
      enabled: Boolean(plateado),
      priceEuros: plateado ? centsToEurosInput(plateado.priceCents) : "",
      vatPercent: plateado ? rateToPercentInput(plateado.vatRate) : "21",
      galvanReference: plateado?.galvanReference ?? "",
    },
  };
}

export function offeringsStateToPayload(
  offerings: ProductOfferingsState
): ProductOfferingsInput | null {
  const basePriceCents = eurosToCents(offerings.base.priceEuros);
  const baseVatRate = percentToRate(offerings.base.vatPercent);
  if (basePriceCents == null || baseVatRate == null) return null;

  const payload: ProductOfferingsInput = {
    base: {
      id: offerings.base.id,
      priceCents: basePriceCents,
      vatRate: baseVatRate,
      priceType: offerings.base.priceType,
      unitLabel: "unidad",
    },
  };

  if (offerings.loncheado.enabled) {
    const priceCents = eurosToCents(offerings.loncheado.priceEuros);
    const vatRate = percentToRate(offerings.loncheado.vatPercent);
    const galvanReference = offerings.loncheado.galvanReference.trim();
    if (priceCents == null || vatRate == null || !galvanReference) return null;
    payload.loncheado = {
      id: offerings.loncheado.id,
      enabled: true,
      priceCents,
      vatRate,
      priceType: PriceType.FIXED,
      unitLabel: "paquete",
      galvanReference: offerings.loncheado.galvanReference.trim(),
    };
  } else {
    payload.loncheado = {
      id: offerings.loncheado.id,
      enabled: false,
      priceCents: 0,
      vatRate: 0.21,
      galvanReference: offerings.loncheado.galvanReference.trim(),
    };
  }

  if (offerings.plateado.enabled) {
    const priceCents = eurosToCents(offerings.plateado.priceEuros);
    const vatRate = percentToRate(offerings.plateado.vatPercent);
    const galvanReference = offerings.plateado.galvanReference.trim();
    if (priceCents == null || vatRate == null || !galvanReference) return null;
    payload.plateado = {
      id: offerings.plateado.id,
      enabled: true,
      priceCents,
      vatRate,
      priceType: PriceType.FIXED,
      unitLabel: "plato",
      galvanReference: offerings.plateado.galvanReference.trim(),
    };
  } else {
    payload.plateado = {
      id: offerings.plateado.id,
      enabled: false,
      priceCents: 0,
      vatRate: 0.21,
      galvanReference: offerings.plateado.galvanReference.trim(),
    };
  }

  return payload;
}

export function formatVariantDisplayName(
  variant: Pick<ProductVariant, "name" | "presentation">
): string {
  const presentation = resolveVariantPresentation(variant);
  if (presentation === VariantPresentation.LONCHEADO) {
    return "Servicio loncheado (sobres)";
  }
  if (presentation === VariantPresentation.PLATEADO) {
    return "Servicio plateado";
  }
  return presentationShortLabel(presentation);
}

export function resolveVariantGalvanReference(
  variant: Pick<ProductVariant, "presentation" | "galvanReference">,
  productReference?: string | null
): string {
  if (variant.galvanReference?.trim()) {
    return variant.galvanReference.trim();
  }
  if (variant.presentation === VariantPresentation.BASE) {
    return productReference?.trim() ?? "";
  }
  return "";
}
