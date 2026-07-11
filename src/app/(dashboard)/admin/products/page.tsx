import { prisma } from "@/lib/prisma";
import { CatalogTabs } from "@/components/CatalogTabs";
import { ensureDefaultShippingRates, getShippingRates } from "@/lib/shipping-rates";

export default async function AdminProductsPage() {
  await ensureDefaultShippingRates();

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
      <h1 className="text-2xl font-bold">Catálogo</h1>
      <CatalogTabs
        products={products}
        shippingRates={shippingRates}
        mode="admin"
      />
    </div>
  );
}
