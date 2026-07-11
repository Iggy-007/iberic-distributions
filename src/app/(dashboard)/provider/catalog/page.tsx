import { prisma } from "@/lib/prisma";
import { CatalogTabs } from "@/components/CatalogTabs";
import { getShippingRates } from "@/lib/shipping-rates";

export default async function ProviderCatalogPage() {
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
      <h1 className="text-2xl font-bold">Catálogo Galvan</h1>
      <CatalogTabs
        products={products}
        shippingRates={shippingRates}
        mode="provider"
      />
    </div>
  );
}
