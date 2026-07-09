"use client";

import { useRouter } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { NEXT_STATUS, NEXT_STATUS_ACTION } from "@/lib/constants";
import { ProviderShipmentForm } from "@/components/ProviderShipmentForm";
import type { CarrierInfo } from "@/lib/carrier";

export function OrderStatusActions({
  orderId,
  currentStatus,
  missingActualsMessage,
  carrier,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  missingActualsMessage?: string | null;
  carrier?: CarrierInfo;
}) {
  const router = useRouter();
  const next = NEXT_STATUS[currentStatus];
  const actionLabel = next ? NEXT_STATUS_ACTION[currentStatus] : null;

  if (!next || !actionLabel) {
    return (
      <p className="text-sm text-stone-500">Pedido completado.</p>
    );
  }

  if (next === "SHIPPED_TO_FINAL") {
    if (missingActualsMessage) {
      return (
        <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
          {missingActualsMessage}
        </p>
      );
    }
    return (
      <ProviderShipmentForm
        orderId={orderId}
        initial={carrier}
        submitLabel={actionLabel}
        onSuccess={() => router.refresh()}
      />
    );
  }

  async function updateStatus() {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Error al actualizar");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      {missingActualsMessage && (
        <p className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
          {missingActualsMessage}
        </p>
      )}
      <button
        type="button"
        onClick={updateStatus}
        disabled={!!missingActualsMessage}
        className="rounded-lg bg-wine px-5 py-2.5 font-medium text-white hover:bg-wine-dark disabled:opacity-60"
      >
        {actionLabel}
      </button>
    </div>
  );
}
