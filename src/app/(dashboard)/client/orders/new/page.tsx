import { prisma } from "@/lib/prisma";
import { NewOrderForm } from "@/components/NewOrderForm";

export default async function NewOrderPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      variants: { where: { active: true }, orderBy: { name: "asc" } },
    },
  });

  const variants = products.flatMap((p) =>
    p.variants.map((v) => ({
      ...v,
      product: { id: p.id, name: p.name },
    }))
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nuevo pedido</h1>
      <NewOrderForm variants={variants} />
    </div>
  );
}
