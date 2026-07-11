import { OrderListToolbar } from "@/components/OrderListToolbar";
import { GroupedOrdersList } from "@/components/GroupedOrdersList";
import { OrderHistoryList } from "@/components/OrderHistoryList";
import { OrderListPagination } from "@/components/OrderListPagination";
import {
  groupOrdersByMonth,
  type OrderListParams,
} from "@/lib/order-list";
import type { OrderWithDetails } from "@/lib/orders";

export function OrdersListShell({
  params,
  operationalOrders,
  historyOrders,
  historyTotal,
  historyTotalPages,
  operationalTotal,
  hrefPrefix,
  showCancel = false,
}: {
  params: OrderListParams;
  operationalOrders: OrderWithDetails[];
  historyOrders: OrderWithDetails[];
  historyTotal: number;
  historyTotalPages: number;
  operationalTotal: number;
  hrefPrefix: string;
  showCancel?: boolean;
}) {
  const monthGroups = groupOrdersByMonth(historyOrders);

  return (
    <div className="space-y-6">
      <OrderListToolbar
        params={params}
        operationalCount={operationalTotal}
        historyTotal={historyTotal}
      />

      {params.view === "operational" ? (
        <>
          {operationalOrders.length >= 200 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Mostrando los 200 pedidos operativos más recientes. Use filtros
              para acotar la búsqueda.
            </p>
          )}
          <GroupedOrdersList
            orders={operationalOrders}
            hrefPrefix={hrefPrefix}
            showCancel={showCancel}
          />
        </>
      ) : (
        <>
          <OrderHistoryList groups={monthGroups} hrefPrefix={hrefPrefix} />
          <OrderListPagination
            params={params}
            totalPages={historyTotalPages}
            total={historyTotal}
          />
        </>
      )}
    </div>
  );
}
