"use client";

import { ProviderShipmentForm } from "@/components/ProviderShipmentForm";
import type { KanbanOrder } from "@/lib/kanban-types";

export function ProviderShipmentPanel({
  order,
  onClose,
  onShipped,
}: {
  order: KanbanOrder;
  onClose: () => void;
  onShipped: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        <header className="border-b border-stone-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">
                Datos del transportista
              </h2>
              <p className="text-sm text-stone-500">
                Pedido #{order.orderNumber} · {order.clientOrg.name}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-stone-500 hover:bg-stone-100"
            >
              ✕
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ProviderShipmentForm
            orderId={order.id}
            initial={{
              carrierCompany: order.carrierCompany,
              carrierTrackingNumber: order.carrierTrackingNumber,
              carrierPhone: order.carrierPhone,
            }}
            onSuccess={onShipped}
            onCancel={onClose}
          />
        </div>
      </aside>
    </div>
  );
}
