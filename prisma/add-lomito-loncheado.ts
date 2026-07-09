import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const lomito = await prisma.product.findFirst({
    where: { name: "Lomito ibérico" },
  });

  if (!lomito) {
    console.log("Producto Lomito ibérico no encontrado. Ejecuta npm run db:seed.");
    return;
  }

  const existing = await prisma.productVariant.findFirst({
    where: { productId: lomito.id, name: "Lomito ibérico loncheado" },
  });

  if (existing) {
    console.log("Lomito ibérico loncheado ya existe.");
    return;
  }

  await prisma.productVariant.create({
    data: {
      productId: lomito.id,
      name: "Lomito ibérico loncheado",
      unitLabel: "unidad",
      priceCents: 350,
      priceType: "FIXED",
      vatRate: 0.21,
    },
  });

  console.log("Añadido: Lomito ibérico loncheado — 3,50 €/paquete + IVA 21%");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
