import { PriceType, PrismaClient, VariantPresentation } from "@prisma/client";
import {
  inferPresentationFromVariantName,
  presentationLabel,
} from "../src/lib/product-presentations";

const prisma = new PrismaClient();

function unitLabelFor(presentation: VariantPresentation) {
  switch (presentation) {
    case VariantPresentation.BASE:
      return "unidad";
    case VariantPresentation.LONCHEADO:
      return "paquete";
    case VariantPresentation.PLATEADO:
      return "plato";
  }
}

function priceTypeFor(presentation: VariantPresentation) {
  return presentation === VariantPresentation.BASE
    ? PriceType.PER_KG
    : PriceType.FIXED;
}

async function main() {
  const variants = await prisma.productVariant.findMany({
    include: { product: true },
  });

  for (const variant of variants) {
    const presentation = inferPresentationFromVariantName(variant.name);
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: {
        presentation,
        name: presentationLabel(presentation),
        unitLabel: unitLabelFor(presentation),
        priceType: priceTypeFor(presentation),
      },
    });
    console.log(
      `${variant.product.name}: ${variant.name} → ${presentationLabel(presentation)}`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
