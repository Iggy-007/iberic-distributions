import { prisma } from "@/lib/prisma";
import { ProductCatalog } from "@/components/ProductCatalog";
import { listShippingServices } from "@/lib/shipping-rates";

export default async function ClientCatalogPage() {
  const [products, shippingServices] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: {
        variants: { where: { active: true }, orderBy: { presentation: "asc" } },
        documents: true,
      },
      orderBy: { name: "asc" },
    }),
    listShippingServices({ activeOnly: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <p className="text-sm text-stone-500 mt-1">Consulta de productos, documentación y envíos</p>
      </div>
      <ProductCatalog products={products} shippingServices={shippingServices} showOrderCta />
    </div>
  );
}
