import { prisma } from "@/lib/prisma";
import { ProductCatalog } from "@/components/ProductCatalog";
import { getShippingRates } from "@/lib/shipping-rates";

export default async function ClientCatalogPage() {
  const [products, shippingRates] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: {
        variants: { where: { active: true }, orderBy: { presentation: "asc" } },
        documents: true,
      },
      orderBy: { name: "asc" },
    }),
    getShippingRates(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Catálogo y documentación</h1>
      <ProductCatalog products={products} shippingRates={shippingRates} />
    </div>
  );
}
