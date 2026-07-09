import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.productDocument.updateMany({
    where: { title: { contains: "Ficha" } },
    data: { docType: "FICHA_TECNICA" },
  });

  const products = await prisma.product.findMany();

  for (const product of products) {
    const hasEtiqueta = await prisma.productDocument.findFirst({
      where: { productId: product.id, docType: "ETIQUETA" },
    });

    if (!hasEtiqueta) {
      const slug = product.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-");

      await prisma.productDocument.create({
        data: {
          productId: product.id,
          docType: "ETIQUETA",
          title: product.name,
          fileUrl: `/uploads/docs/${slug}-etiqueta.pdf`,
        },
      });
      console.log("Etiqueta añadida:", product.name);
    }

    const fichas = await prisma.productDocument.findMany({
      where: { productId: product.id, docType: "FICHA_TECNICA" },
    });

    for (const ficha of fichas) {
      if (!ficha.title || ficha.title.startsWith("Ficha técnica")) {
        await prisma.productDocument.update({
          where: { id: ficha.id },
          data: { title: product.name },
        });
      }
    }
  }

  console.log("Documentos actualizados con tipos Ficha técnica / Etiqueta.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
