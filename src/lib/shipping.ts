import { ShippingType } from "@prisma/client";
import {
  INTERNATIONAL_SHIPPING_CENTS,
  NATIONAL_SHIPPING_CENTS,
  SPAIN_COUNTRY_NAMES,
} from "./constants";

export function resolveShippingType(country: string): ShippingType {
  const normalized = country.trim().toLowerCase();
  const isSpain = SPAIN_COUNTRY_NAMES.some(
    (name) => name.toLowerCase() === normalized
  );
  return isSpain ? ShippingType.NATIONAL : ShippingType.INTERNATIONAL;
}

export function getShippingCostCents(shippingType: ShippingType): number {
  return shippingType === ShippingType.NATIONAL
    ? NATIONAL_SHIPPING_CENTS
    : INTERNATIONAL_SHIPPING_CENTS;
}

export function formatEuros(cents: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function shippingTypeLabel(type: "NATIONAL" | "INTERNATIONAL"): string {
  return type === "NATIONAL" ? "Nacional (España)" : "Internacional";
}
