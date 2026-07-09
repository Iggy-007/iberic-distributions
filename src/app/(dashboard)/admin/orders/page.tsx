import { prisma } from "@/lib/prisma";
import { GroupedOrdersList } from "@/components/GroupedOrdersList";
import { orderInclude } from "@/lib/orders";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Todos los pedidos</h1>
      <GroupedOrdersList orders={orders} hrefPrefix="/admin/orders" />
    </div>
  );
}
