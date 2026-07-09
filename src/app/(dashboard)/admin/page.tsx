import Link from "next/link";
import { getOrderStats } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { OrderCard } from "@/components/OrderCard";
import { orderInclude } from "@/lib/orders";

export default async function AdminDashboardPage() {
  const [stats, recentOrders] = await Promise.all([
    getOrderStats(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: orderInclude,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Panel de administración</h1>
        <p className="text-stone-500 mt-1">Vista general de Iberic Distributions</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Pedidos abiertos</p>
          <p className="text-3xl font-bold text-wine mt-1">{stats.open}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">En proceso</p>
          <p className="text-3xl font-bold text-wine mt-1">{stats.inProcess}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Enviados esta semana</p>
          <p className="text-3xl font-bold text-wine mt-1">{stats.shippedWeek}</p>
        </div>
      </div>

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
          Productos y precios
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
        <div className="space-y-3">
          {recentOrders.map((order) => (
            <OrderCard key={order.id} order={order} href={`/admin/orders/${order.id}`} />
          ))}
        </div>
      </section>
    </div>
  );
}
