import { getRequiredSession } from "@/lib/auth";
import { OrdersListShell } from "@/components/OrdersListShell";
import {
  countHistoryOrders,
  countOperationalOrders,
  fetchHistoryOrders,
  fetchOperationalOrders,
  getOrderListRoleFilter,
  parseOrderListSearchParams,
} from "@/lib/order-list";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getRequiredSession();
  const params = parseOrderListSearchParams(await searchParams);
  const orgFilter = getOrderListRoleFilter(
    session.user.role,
    session.user.organizationId
  );

  const [operationalOrders, historyResult, operationalTotal, historyTotal] =
    await Promise.all([
      params.view === "operational"
        ? fetchOperationalOrders(params, orgFilter)
        : Promise.resolve([]),
      params.view === "history"
        ? fetchHistoryOrders(params, orgFilter)
        : Promise.resolve({ orders: [], total: 0, totalPages: 1 }),
      countOperationalOrders(params, orgFilter),
      countHistoryOrders(params, orgFilter),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Todos los pedidos</h1>
      <OrdersListShell
        params={params}
        operationalOrders={operationalOrders}
        historyOrders={historyResult.orders}
        historyTotal={historyTotal}
        historyTotalPages={historyResult.totalPages}
        operationalTotal={operationalTotal}
        hrefPrefix="/admin/orders"
      />
    </div>
  );
}
