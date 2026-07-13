import { prisma } from "@/lib/prisma";
import { NewOrderForm } from "@/components/NewOrderForm";
import { listShippingServices } from "@/lib/shipping-rates";

export default async function NewOrderPage() {
  const [products, shippingServices] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: {
        variants: { where: { active: true }, orderBy: { presentation: "asc" } },
      },
      orderBy: { name: "asc" },
    }),
    listShippingServices({ activeOnly: true }),
  ]);

  const variants = products.flatMap((p) =>
    p.variants.map((v) => ({
      ...v,
      product: {
        id: p.id,
        name: p.name,
        galvanReference: p.galvanReference,
      },
    }))
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nuevo pedido</h1>
      <NewOrderForm variants={variants} shippingServices={shippingServices} />
    </div>
  );
}
