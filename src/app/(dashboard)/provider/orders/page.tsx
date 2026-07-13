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
          Arrastre entre columnas en escritorio o use «Avanzar» en móvil. Registre
          datos reales antes de mover cada pedido.
        </p>
      </div>
      <ProviderKanbanBoard orders={kanbanOrders} />
    </div>
  );
}
