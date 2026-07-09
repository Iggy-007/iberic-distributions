import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.productVariant.updateMany({
    where: { name: "Jamón entero" },
    data: {
      unitLabel: "kg",
      priceCents: 2300,
      priceType: "PER_KG",
    },
  });

  await prisma.productVariant.updateMany({
    where: { name: "Lomito ibérico" },
    data: {
      unitLabel: "kg",
      priceCents: 4900,
      priceType: "PER_KG",
    },
  });

  console.log("Precios actualizados:");
  console.log("  Jamón Ibérico 75% (entero): 23,00 €/kg + IVA");
  console.log("  Lomito ibérico: 49,00 €/kg + IVA");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
