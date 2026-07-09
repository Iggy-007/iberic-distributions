"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { NEXT_STATUS, PROVIDER_KANBAN_COLUMNS } from "@/lib/constants";
import {
  getOrderMissingActualsMessage,
  orderHasRequiredActuals,
} from "@/lib/line-actuals";
import { ProviderOrderActualsPanel } from "@/components/ProviderOrderActualsPanel";
import { ProviderShipmentPanel } from "@/components/ProviderShipmentPanel";
import { KanbanCard } from "@/components/KanbanCard";
import type { KanbanOrder } from "@/lib/kanban-types";

const COLUMN_STYLES = {
  workflow: {
    base: "border-stone-200 bg-stone-50/80",
    drop: "border-wine bg-wine/5",
    header: "border-stone-200 text-stone-900",
  },
  cancelled: {
    base: "border-stone-400 bg-stone-200/70",
    drop: "border-stone-400 bg-stone-200/70",
    header: "border-stone-400 text-stone-700",
  },
} as const;

export function ProviderKanbanBoard({ orders }: { orders: KanbanOrder[] }) {
  const router = useRouter();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<KanbanOrder | null>(null);
  const [shipmentOrder, setShipmentOrder] = useState<KanbanOrder | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<OrderStatus | null>(null);

  const ordersByStatus = useMemo(() => {
    const map = new Map<OrderStatus, KanbanOrder[]>();
    for (const column of PROVIDER_KANBAN_COLUMNS) {
      map.set(
        column.status,
        orders.filter((o) => o.status === column.status)
      );
    }
    return map;
  }, [orders]);

  async function moveOrder(orderId: string, targetStatus: OrderStatus) {
    if (targetStatus === "CANCELLED") return;

    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === targetStatus || order.status === "CANCELLED") {
      return;
    }

    const expectedNext = NEXT_STATUS[order.status];
    if (targetStatus !== expectedNext) {
      setAlert(
        "Solo puede avanzar el pedido a la siguiente columna del flujo."
      );
      return;
    }

    if (!orderHasRequiredActuals(order.lines)) {
      setAlert(
        getOrderMissingActualsMessage(order.lines) ??
          "Falta información obligatoria en el pedido."
      );
      setSelectedOrder(order);
      return;
    }

    if (targetStatus === "SHIPPED_TO_FINAL") {
      setAlert(null);
      setShipmentOrder(order);
      return;
    }

    setAlert(null);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: targetStatus }),
    });

    if (!res.ok) {
      const data = await res.json();
      setAlert(data.error ?? "No se pudo actualizar el pedido");
      return;
    }

    router.refresh();
  }

  function handleDrop(targetStatus: OrderStatus, orderId: string) {
    setDropTarget(null);
    setDraggingId(null);
    void moveOrder(orderId, targetStatus);
  }

  return (
    <div className="space-y-6">
      {alert && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <span>{alert}</span>
          <button
            type="button"
            onClick={() => setAlert(null)}
            className="shrink-0 font-medium underline"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="grid min-w-[68rem] gap-4 grid-cols-5">
          {PROVIDER_KANBAN_COLUMNS.map((column) => {
            const columnOrders = ordersByStatus.get(column.status) ?? [];
            const isCancelled = column.variant === "cancelled";
            const styles = COLUMN_STYLES[column.variant];
            const isDropTarget =
              !isCancelled && dropTarget === column.status;

            return (
              <section
                key={column.status}
                onDragOver={
                  isCancelled
                    ? undefined
                    : (e) => {
                        e.preventDefault();
                        setDropTarget(column.status);
                      }
                }
                onDragLeave={
                  isCancelled ? undefined : () => setDropTarget(null)
                }
                onDrop={
                  isCancelled
                    ? undefined
                    : (e) => {
                        e.preventDefault();
                        const orderId = e.dataTransfer.getData("text/order-id");
                        if (orderId) handleDrop(column.status, orderId);
                      }
                }
                className={`flex min-h-[22rem] flex-col rounded-xl border p-3 transition ${
                  isDropTarget ? styles.drop : styles.base
                }`}
              >
                <header className={`mb-3 border-b pb-2 ${styles.header}`}>
                  <h2 className="text-sm font-semibold">{column.label}</h2>
                  <p className="text-xs opacity-80">
                    {columnOrders.length} pedido
                    {columnOrders.length !== 1 ? "s" : ""}
                  </p>
                  {isCancelled && (
                    <p className="text-[10px] mt-1 opacity-70">
                      Doble clic para ver detalle y reactivar
                    </p>
                  )}
                </header>
                <div className="flex flex-1 flex-col gap-2">
                  {columnOrders.map((order) => (
                    <KanbanCard
                      key={order.id}
                      order={order}
                      cancelled={isCancelled}
                      draggable={!isCancelled}
                      onSelect={() => {
                        setAlert(null);
                        setSelectedOrder(order);
                      }}
                      onDragStart={() => setDraggingId(order.id)}
                    />
                  ))}
                  {columnOrders.length === 0 && (
                    <p className="py-8 text-center text-xs opacity-60">
                      {isCancelled
                        ? "Sin pedidos cancelados"
                        : "Arrastre pedidos aquí"}
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {selectedOrder && (
        <ProviderOrderActualsPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSaved={() => {
            setSelectedOrder(null);
            setAlert(null);
            router.refresh();
          }}
        />
      )}

      {shipmentOrder && (
        <ProviderShipmentPanel
          order={shipmentOrder}
          onClose={() => setShipmentOrder(null)}
          onShipped={() => {
            setShipmentOrder(null);
            setAlert(null);
            router.refresh();
          }}
        />
      )}

      {draggingId && (
        <p className="text-xs text-stone-500 text-center">
          Suelte el pedido en la siguiente columna. Para «En envío» se pedirán
          los datos del transportista.
        </p>
      )}
    </div>
  );
}
