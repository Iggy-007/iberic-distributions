import { prisma } from "@/lib/prisma";
import { orderInclude } from "@/lib/orders";
import { ProviderKanbanBoard } from "@/components/ProviderKanbanBoard";
import { toKanbanOrder } from "@/lib/kanban-types";

export default async function ProviderOrdersPage() {
  const orders = await prisma.order.findMany({
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

  const kanbanOrders = orders.map(toKanbanOrder);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-stone-500 mt-1">
          Arrastre los pedidos entre columnas. Clic en una tarjeta para datos
          reales; doble clic para abrir el detalle.
        </p>
      </div>
      <ProviderKanbanBoard orders={kanbanOrders} />
    </div>
  );
}
