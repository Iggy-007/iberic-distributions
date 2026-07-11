import { PriceType } from "@prisma/client";
import { z } from "zod";
import type { ProductOfferingsInput } from "@/lib/product-presentations";

const offeringSchema = z.object({
  id: z.string().optional(),
  enabled: z.boolean().optional(),
  priceCents: z.number().int().min(0),
  vatRate: z.number().min(0).max(1),
  priceType: z.enum(["FIXED", "PER_KG"]).optional(),
  unitLabel: z.string().optional(),
  galvanReference: z.string().optional(),
});

export const productOfferingsSchema = z.object({
  base: offeringSchema,
  loncheado: offeringSchema.extend({ enabled: z.boolean() }).optional(),
  plateado: offeringSchema.extend({ enabled: z.boolean() }).optional(),
});

export const createProductWithOfferingsSchema = z.object({
  name: z.string().min(1),
  galvanReference: z.string().min(1, "La referencia Galvan es obligatoria"),
  description: z.string().optional(),
  offerings: productOfferingsSchema,
});

export const updateProductWithOfferingsSchema = z.object({
  name: z.string().optional(),
  galvanReference: z.string().min(1).optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
  offerings: productOfferingsSchema.optional(),
});

export type ParsedProductOfferings = ProductOfferingsInput;
