"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { canClientCancelOrder } from "@/lib/order-groups";

export function CancelOrderButton({
  orderId,
  status,
  compact = false,
}: {
  orderId: string;
  status: OrderStatus;
  compact?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  if (!canClientCancelOrder(status)) return null;

  async function cancel() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: "POST",
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo cancelar el pedido");
      return;
    }

    setConfirming(false);
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirming(true);
        }}
        className={
          compact
            ? "text-sm text-red-600 hover:text-red-700 hover:underline"
            : "rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        }
      >
        Cancelar pedido
      </button>
    );
  }

  return (
    <div
      className={compact ? "space-y-1" : "rounded-lg border border-red-100 bg-red-50 p-4 space-y-3"}
      onClick={(e) => e.stopPropagation()}
    >
      <p className={compact ? "text-xs text-stone-600" : "text-sm text-stone-700"}>
        ¿Solicitar la cancelación de este pedido?
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={cancel}
          disabled={loading}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-60"
        >
          {loading ? "Cancelando..." : "Confirmar cancelación"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
        >
          No
        </button>
      </div>
    </div>
  );
}
