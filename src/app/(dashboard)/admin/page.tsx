import Link from "next/link";
import { getOrderStats } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { OrderCard } from "@/components/OrderCard";
import { orderInclude } from "@/lib/orders";
import { CatalogNotificationsList } from "@/components/CatalogNotificationsList";
import { getUnreadCatalogNotificationCount } from "@/lib/catalog-notifications";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildOrderListQuery } from "@/lib/order-list";

export default async function AdminDashboardPage() {
  const [stats, recentOrders, catalogUnread] = await Promise.all([
    getOrderStats(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: orderInclude,
    }),
    getUnreadCatalogNotificationCount(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Panel de administración</h1>
        <p className="text-stone-500 mt-1">Vista general de Iberic Distributions</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Link
          href={`/admin/orders${buildOrderListQuery({ view: "operational" })}`}
          className="rounded-xl border border-stone-200 bg-white p-5 hover:border-wine/30 transition"
        >
          <p className="text-sm text-stone-500">Pedidos abiertos</p>
          <p className="text-3xl font-bold text-wine mt-1">{stats.open}</p>
        </Link>
        <Link
          href={`/admin/orders${buildOrderListQuery({ view: "operational", status: "IN_PROCESS" })}`}
          className="rounded-xl border border-stone-200 bg-white p-5 hover:border-wine/30 transition"
        >
          <p className="text-sm text-stone-500">En proceso</p>
          <p className="text-3xl font-bold text-wine mt-1">{stats.inProcess}</p>
        </Link>
        <Link
          href={`/admin/orders${buildOrderListQuery({ view: "history" })}`}
          className="rounded-xl border border-stone-200 bg-white p-5 hover:border-wine/30 transition"
        >
          <p className="text-sm text-stone-500">Enviados esta semana</p>
          <p className="text-3xl font-bold text-wine mt-1">{stats.shippedWeek}</p>
        </Link>
        <Link
          href="/admin/products"
          className="rounded-xl border border-amber-200 bg-amber-50 p-5 hover:border-amber-300 transition"
        >
          <p className="text-sm text-stone-600">Cambios en catálogo</p>
          <p className="text-3xl font-bold text-wine mt-1">{catalogUnread}</p>
          <p className="text-xs text-stone-500 mt-1">sin leer</p>
        </Link>
      </div>

      <CatalogNotificationsList />

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/users"
          className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-dark"
        >
          Gestionar usuarios
        </Link>
        <Link
          href="/admin/products"
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-white"
        >
          Catálogo
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-white"
        >
          Ver todos los pedidos
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-4">Pedidos recientes</h2>
        {recentOrders.length === 0 ? (
          <EmptyState
            title="No hay pedidos recientes"
            description="Cuando los clientes creen pedidos aparecerán aquí."
            actionHref="/admin/users"
            actionLabel="Gestionar usuarios"
          />
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <OrderCard key={order.id} order={order} href={`/admin/orders/${order.id}`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
