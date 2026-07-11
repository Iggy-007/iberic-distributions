"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { canCancelOrder } from "@/lib/order-groups";

const textareaClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-wine focus:outline-none focus:ring-1 focus:ring-wine";

export function CancelOrderButton({
  orderId,
  status,
  compact = false,
  onCancelled,
}: {
  orderId: string;
  status: OrderStatus;
  compact?: boolean;
  onCancelled?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [justification, setJustification] = useState("");

  if (!canCancelOrder(status)) return null;

  async function cancel() {
    const trimmed = justification.trim();
    if (!trimmed) {
      setError("Indique la justificación de la cancelación");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ justification: trimmed }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo cancelar el pedido");
      return;
    }

    setConfirming(false);
    setJustification("");
    if (onCancelled) {
      onCancelled();
    } else {
      router.refresh();
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirming(true);
          setError("");
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
      className={
        compact
          ? "space-y-2"
          : "rounded-lg border border-red-100 bg-red-50 p-4 space-y-3"
      }
      onClick={(e) => e.stopPropagation()}
    >
      <p className={compact ? "text-xs text-stone-600" : "text-sm text-stone-700"}>
        ¿Cancelar este pedido? Indique el motivo.
      </p>
      <label className="block text-sm font-medium text-stone-700">
        Justificación
        <textarea
          required
          rows={compact ? 2 : 3}
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          className={textareaClass}
          placeholder="Motivo de la cancelación..."
        />
      </label>
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
          onClick={() => {
            setConfirming(false);
            setJustification("");
            setError("");
          }}
          disabled={loading}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
        >
          No
        </button>
      </div>
    </div>
  );
}
