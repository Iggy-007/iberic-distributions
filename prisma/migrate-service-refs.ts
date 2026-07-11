import { PrismaClient, VariantPresentation } from "@prisma/client";

const prisma = new PrismaClient();

const SERVICE_REFS: Record<string, Partial<Record<VariantPresentation, string>>> = {
  "Jamón Ibérico 75%": {
    [VariantPresentation.LONCHEADO]: "GAL-JAM-75-LON",
    [VariantPresentation.PLATEADO]: "GAL-JAM-75-PLA",
  },
  "Lomito ibérico": {
    [VariantPresentation.LONCHEADO]: "GAL-LOM-01-LON",
  },
};

async function main() {
  const variants = await prisma.productVariant.findMany({
    include: { product: true },
  });

  for (const variant of variants) {
    const productRefs = SERVICE_REFS[variant.product.name];
    const defaultRef = productRefs?.[variant.presentation] ?? "";

    if (
      variant.presentation === VariantPresentation.BASE ||
      variant.galvanReference.trim()
    ) {
      continue;
    }

    if (!defaultRef) continue;

    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { galvanReference: defaultRef },
    });

    console.log(
      `${variant.product.name} · ${variant.presentation}: ${defaultRef}`
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
