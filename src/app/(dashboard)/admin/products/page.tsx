import { prisma } from "@/lib/prisma";
import { AdminProductsEditor } from "@/components/AdminProductsEditor";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      variants: { where: { active: true }, orderBy: { name: "asc" } },
      documents: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Productos y documentación</h1>
      <p className="text-sm text-stone-500">
        Precios base sin IVA. IVA 10% (jamón entero, lomito) y 21% (loncheado,
        plateado).
      </p>
      <AdminProductsEditor initialProducts={products} />
    </div>
  );
}
