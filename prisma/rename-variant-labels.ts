import { prisma } from "../src/lib/prisma";

async function renameVariant(
  productName: string,
  from: string,
  to: string
) {
  const product = await prisma.product.findFirst({ where: { name: productName } });
  if (!product) {
    console.log(`Producto no encontrado: ${productName}`);
    return;
  }

  const result = await prisma.productVariant.updateMany({
    where: { productId: product.id, name: from },
    data: { name: to },
  });

  console.log(`${productName}: "${from}" → "${to}" (${result.count})`);
}

async function main() {
  await renameVariant("Jamón Ibérico 75%", "Jamón loncheado", "Loncheado");
  await renameVariant("Jamón Ibérico 75%", "Jamón plateado", "Plateado");
  await renameVariant("Jamón Ibérico 75%", "Jamón entero", "Entero");
  await renameVariant("Lomito ibérico", "Lomito ibérico loncheado", "Loncheado");
  await renameVariant("Lomito ibérico", "Lomito ibérico", "Entero");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
