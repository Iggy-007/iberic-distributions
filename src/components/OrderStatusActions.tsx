"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { NEXT_STATUS, NEXT_STATUS_ACTION } from "@/lib/constants";
import { ProviderShipmentForm } from "@/components/ProviderShipmentForm";
import { Alert } from "@/components/ui/Alert";
import { btnPrimary } from "@/lib/ui-classes";
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const next = NEXT_STATUS[currentStatus];
  const actionLabel = next ? NEXT_STATUS_ACTION[currentStatus] : null;

  if (!next || !actionLabel) {
    return <p className="text-sm text-stone-500">Pedido completado.</p>;
  }

  if (next === "SHIPPED_TO_FINAL") {
    if (missingActualsMessage) {
      return <Alert variant="warning">{missingActualsMessage}</Alert>;
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
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al actualizar");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      {missingActualsMessage && (
        <Alert variant="warning" className="mb-3">
          {missingActualsMessage}
        </Alert>
      )}
      {error && (
        <Alert variant="error" className="mb-3" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      <button
        type="button"
        onClick={updateStatus}
        disabled={!!missingActualsMessage || loading}
        className={btnPrimary}
      >
        {loading ? "Actualizando..." : actionLabel}
      </button>
    </div>
  );
}
