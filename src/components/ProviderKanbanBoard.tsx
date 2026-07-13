"use client";

import { useEffect, useMemo, useState } from "react";
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
import { KanbanOnboardingBanner } from "@/components/KanbanOnboardingBanner";
import { Alert } from "@/components/ui/Alert";
import type { KanbanOrder } from "@/lib/kanban-types";
import { cn } from "@/lib/cn";

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
  const [localOrders, setLocalOrders] = useState(orders);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<KanbanOrder | null>(null);
  const [shipmentOrder, setShipmentOrder] = useState<KanbanOrder | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<OrderStatus | null>(null);
  const [mobileColumn, setMobileColumn] = useState<OrderStatus>("SENT");

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const ordersByStatus = useMemo(() => {
    const map = new Map<OrderStatus, KanbanOrder[]>();
    for (const column of PROVIDER_KANBAN_COLUMNS) {
      map.set(
        column.status,
        localOrders.filter((o) => o.status === column.status)
      );
    }
    return map;
  }, [localOrders]);

  function patchOrderStatus(orderId: string, status: OrderStatus) {
    setLocalOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  }

  async function moveOrder(orderId: string, targetStatus: OrderStatus) {
    if (targetStatus === "CANCELLED") return;

    const order = localOrders.find((o) => o.id === orderId);
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
    const previousStatus = order.status;
    patchOrderStatus(orderId, targetStatus);

    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: targetStatus }),
    });

    if (!res.ok) {
      const data = await res.json();
      patchOrderStatus(orderId, previousStatus);
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

  function renderColumn(
    column: (typeof PROVIDER_KANBAN_COLUMNS)[number],
    compact = false
  ) {
    const columnOrders = ordersByStatus.get(column.status) ?? [];
    const isCancelled = column.variant === "cancelled";
    const styles = COLUMN_STYLES[column.variant];
    const isDropTarget = !isCancelled && dropTarget === column.status;

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
        onDragLeave={isCancelled ? undefined : () => setDropTarget(null)}
        onDrop={
          isCancelled
            ? undefined
            : (e) => {
                e.preventDefault();
                const orderId = e.dataTransfer.getData("text/order-id");
                if (orderId) handleDrop(column.status, orderId);
              }
        }
        className={cn(
          "flex min-h-[22rem] flex-col rounded-xl border p-3 transition",
          isDropTarget ? styles.drop : styles.base,
          compact ? "min-h-0" : ""
        )}
      >
        <header className={cn("mb-3 border-b pb-2", styles.header)}>
          <h2 className="text-sm font-semibold">{column.label}</h2>
          <p className="text-xs opacity-80">
            {columnOrders.length} pedido
            {columnOrders.length !== 1 ? "s" : ""}
          </p>
        </header>
        <div className="flex flex-1 flex-col gap-2">
          {columnOrders.map((order) => {
            const next = NEXT_STATUS[order.status];
            return (
              <KanbanCard
                key={order.id}
                order={order}
                cancelled={isCancelled}
                draggable={!isCancelled}
                showAdvance={!!next && !isCancelled}
                onOpenActuals={() => {
                  setAlert(null);
                  setSelectedOrder(order);
                }}
                onAdvance={() => next && void moveOrder(order.id, next)}
                onDragStart={() => setDraggingId(order.id)}
              />
            );
          })}
          {columnOrders.length === 0 && (
            <p className="py-8 text-center text-xs opacity-60">
              {isCancelled ? "Sin pedidos cancelados" : "Arrastre pedidos aquí"}
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <KanbanOnboardingBanner />

      {alert && (
        <Alert variant="error" onDismiss={() => setAlert(null)}>
          {alert}
        </Alert>
      )}

      {/* Mobile: tabbed single column */}
      <div className="md:hidden space-y-3">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {PROVIDER_KANBAN_COLUMNS.map((col) => (
            <button
              key={col.status}
              type="button"
              onClick={() => setMobileColumn(col.status)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-xs font-medium min-h-[44px]",
                mobileColumn === col.status
                  ? "bg-wine text-white"
                  : "border border-stone-300 text-stone-700"
              )}
            >
              {col.label.split(" ").slice(-1)[0]} (
              {ordersByStatus.get(col.status)?.length ?? 0})
            </button>
          ))}
        </div>
        {PROVIDER_KANBAN_COLUMNS.filter((c) => c.status === mobileColumn).map(
          (col) => renderColumn(col, true)
        )}
      </div>

      {/* Desktop: full kanban */}
      <div className="hidden md:block overflow-x-auto pb-2 -mx-1 px-1">
        <div className="grid min-w-[68rem] gap-4 grid-cols-5">
          {PROVIDER_KANBAN_COLUMNS.map((col) => renderColumn(col))}
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
        <p className="hidden md:block text-xs text-stone-500 text-center">
          Suelte el pedido en la siguiente columna. Para «En envío» se pedirán
          los datos del transportista.
        </p>
      )}
    </div>
  );
}
