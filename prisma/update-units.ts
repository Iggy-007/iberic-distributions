import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.productVariant.updateMany({
    where: { name: "Jamón entero" },
    data: { unitLabel: "unidad", priceType: "PER_KG" },
  });
  await prisma.productVariant.updateMany({
    where: { name: "Lomito ibérico" },
    data: { unitLabel: "unidad", priceType: "PER_KG" },
  });
  await prisma.productVariant.updateMany({
    where: { name: "Jamón loncheado" },
    data: { unitLabel: "unidad" },
  });
  await prisma.productVariant.updateMany({
    where: { name: "Jamón plateado" },
    data: { unitLabel: "unidad" },
  });
  await prisma.productVariant.updateMany({
    where: { name: "Lomito ibérico loncheado" },
    data: { unitLabel: "unidad" },
  });

  console.log("Variantes actualizadas a pedido por unidades");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
