import { prisma } from "@/lib/prisma";
import { CatalogTabs } from "@/components/CatalogTabs";
import { ensureDefaultShippingRates, listShippingServices } from "@/lib/shipping-rates";

export default async function AdminProductsPage() {
  await ensureDefaultShippingRates();

  const [products, shippingServices] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: {
        variants: { where: { active: true }, orderBy: { presentation: "asc" } },
        documents: true,
      },
      orderBy: { name: "asc" },
    }),
    listShippingServices(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <p className="text-sm text-stone-500 mt-1">Gestión de productos, servicios y envíos</p>
      </div>
      <CatalogTabs
        products={products}
        shippingServices={shippingServices}
        mode="admin"
      />
    </div>
  );
}
