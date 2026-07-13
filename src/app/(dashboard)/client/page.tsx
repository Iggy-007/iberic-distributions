import Link from "next/link";
import { getRequiredSession } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/orders";
import { OrderCard } from "@/components/OrderCard";
import { ClientOnboardingChecklist } from "@/components/ClientOnboardingChecklist";

export default async function ClientDashboardPage() {
  const session = await getRequiredSession();
  const orders = await getOrdersForUser(
    session.user.id,
    session.user.role,
    session.user.organizationId
  );
  const recent = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bienvenido, {session.user.name}</h1>
          <p className="text-stone-500 mt-1">Sake Team Food — Gestión de pedidos</p>
        </div>
        <Link
          href="/client/orders/new"
          className="rounded-lg bg-wine px-5 py-2.5 font-medium text-white hover:bg-wine-dark"
        >
          Nuevo pedido
        </Link>
      </div>

      <ClientOnboardingChecklist hasOrders={orders.length > 0} />

      <section>
        <h2 className="text-lg font-semibold mb-4">Mis pedidos recientes</h2>
        <div className="space-y-3">
          {recent.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              href={`/client/orders/${order.id}`}
            />
          ))}
          {recent.length === 0 && (
            <p className="text-stone-500">
              Aún no tiene pedidos.{" "}
              <Link href="/client/orders/new" className="text-wine underline">
                Crear el primero
              </Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
