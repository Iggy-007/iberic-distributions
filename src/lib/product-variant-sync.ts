import {
  PriceType,
  Prisma,
  VariantPresentation,
} from "@prisma/client";
import {
  type ProductOfferingsInput,
  presentationLabel,
} from "@/lib/product-presentations";

type Tx = Prisma.TransactionClient;

function offeringForPresentation(
  offerings: ProductOfferingsInput,
  presentation: VariantPresentation
) {
  switch (presentation) {
    case VariantPresentation.BASE:
      return { enabled: true, ...offerings.base };
    case VariantPresentation.LONCHEADO:
      return offerings.loncheado;
    case VariantPresentation.PLATEADO:
      return offerings.plateado;
  }
}

function variantDefaults(presentation: VariantPresentation) {
  switch (presentation) {
    case VariantPresentation.BASE:
      return {
        name: presentationLabel(presentation),
        unitLabel: "unidad",
        priceType: PriceType.PER_KG,
      };
    case VariantPresentation.LONCHEADO:
      return {
        name: presentationLabel(presentation),
        unitLabel: "paquete",
        priceType: PriceType.FIXED,
      };
    case VariantPresentation.PLATEADO:
      return {
        name: presentationLabel(presentation),
        unitLabel: "plato",
        priceType: PriceType.FIXED,
      };
  }
}

export async function syncProductOfferings(
  tx: Tx,
  productId: string,
  offerings: ProductOfferingsInput
) {
  const existing = await tx.productVariant.findMany({ where: { productId } });

  for (const presentation of [
    VariantPresentation.BASE,
    VariantPresentation.LONCHEADO,
    VariantPresentation.PLATEADO,
  ]) {
    const config = offeringForPresentation(offerings, presentation);
    const defaults = variantDefaults(presentation);
    const current = existing.find((variant) => variant.presentation === presentation);

    if (presentation !== VariantPresentation.BASE && !config?.enabled) {
      if (current) {
        await tx.productVariant.update({
          where: { id: current.id },
          data: { active: false },
        });
      }
      continue;
    }

    if (!config) {
      throw new Error("La presentación base es obligatoria");
    }

    const data = {
      name: defaults.name,
      presentation,
      galvanReference: config.galvanReference?.trim() ?? "",
      unitLabel: config.unitLabel ?? defaults.unitLabel,
      priceCents: config.priceCents,
      priceType: config.priceType ?? defaults.priceType,
      vatRate: config.vatRate,
      active: true,
    };

    if (current) {
      await tx.productVariant.update({
        where: { id: current.id },
        data,
      });
      continue;
    }

    await tx.productVariant.create({
      data: {
        productId,
        ...data,
      },
    });
  }
}

export const variantIncludeOrder = {
  orderBy: [
    { presentation: "asc" as const },
    { name: "asc" as const },
  ],
};
