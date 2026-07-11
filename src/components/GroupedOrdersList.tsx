import { OrderCard } from "@/components/OrderCard";
import type { OrderWithDetails } from "@/lib/orders";
import {
  groupOrdersByStatus,
  ORDER_GROUP_LABELS,
} from "@/lib/order-groups";

function OrderSection({
  title,
  orders,
  hrefPrefix,
  showCancel,
  emptyMessage,
}: {
  title: string;
  orders: OrderWithDetails[];
  hrefPrefix: string;
  showCancel?: boolean;
  emptyMessage?: string;
}) {
  if (orders.length === 0 && !emptyMessage) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-stone-800">
        {title} ({orders.length})
      </h2>
      {orders.length === 0 ? (
        <p className="text-sm text-stone-500">{emptyMessage}</p>
      ) : (
        orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            href={`${hrefPrefix}/${order.id}`}
            showCancel={showCancel}
          />
        ))
      )}
    </section>
  );
}

export function GroupedOrdersList({
  orders,
  hrefPrefix,
  showCancel = false,
}: {
  orders: OrderWithDetails[];
  hrefPrefix: string;
  showCancel?: boolean;
}) {
  const groups = groupOrdersByStatus(orders);

  if (orders.length === 0) {
    return (
      <p className="text-stone-500">No hay pedidos todavía.</p>
    );
  }

  return (
    <div className="space-y-8">
      <OrderSection
        title={ORDER_GROUP_LABELS.active}
        orders={groups.active}
        hrefPrefix={hrefPrefix}
        showCancel={showCancel}
      />
      <OrderSection
        title={ORDER_GROUP_LABELS.inProgress}
        orders={groups.inProgress}
        hrefPrefix={hrefPrefix}
        showCancel={showCancel}
      />
      <OrderSection
        title={ORDER_GROUP_LABELS.cancelled}
        orders={groups.cancelled}
        hrefPrefix={hrefPrefix}
        emptyMessage="No hay pedidos cancelados."
      />
    </div>
  );
}
