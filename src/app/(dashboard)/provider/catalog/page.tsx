import { prisma } from "@/lib/prisma";
import { ProductCatalog } from "@/components/ProductCatalog";

export default async function ProviderCatalogPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      variants: { where: { active: true } },
      documents: true,
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Catálogo Galvan</h1>
      <ProductCatalog products={products} />
    </div>
  );
}
