import { getRequiredSession } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/orders";
import { GroupedOrdersList } from "@/components/GroupedOrdersList";
import Link from "next/link";

export default async function ClientOrdersPage() {
  const session = await getRequiredSession();
  const orders = await getOrdersForUser(
    session.user.id,
    session.user.role,
    session.user.organizationId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Mis pedidos</h1>
        <Link
          href="/client/orders/new"
          className="rounded-lg bg-wine px-4 py-2 text-sm text-white"
        >
          Nuevo pedido
        </Link>
      </div>
      <GroupedOrdersList
        orders={orders}
        hrefPrefix="/client/orders"
        showCancel
      />
    </div>
  );
}
