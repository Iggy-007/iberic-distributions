"use client";

import { ProviderShipmentForm } from "@/components/ProviderShipmentForm";
import { Drawer } from "@/components/ui/Drawer";
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
    <Drawer
      title="Datos del transportista"
      subtitle={`Pedido #${order.orderNumber} · ${order.clientOrg.name}`}
      onClose={onClose}
    >
      <ProviderShipmentForm
        orderId={order.id}
        initial={{
          carrierCompany: order.carrierCompany,
          carrierTrackingNumber: order.carrierTrackingNumber,
          carrierTrackingUrl: order.carrierTrackingUrl,
          carrierPhone: order.carrierPhone,
        }}
        onSuccess={onShipped}
        onCancel={onClose}
      />
    </Drawer>
  );
}
