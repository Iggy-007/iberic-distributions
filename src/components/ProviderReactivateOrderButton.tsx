"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProviderReactivateOrderButton({
  orderId,
}: {
  orderId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function reactivate() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "SENT",
        note: "Pedido reactivado por el proveedor",
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo reactivar el pedido");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={reactivate}
        disabled={loading}
        className="rounded-lg bg-wine px-5 py-2.5 font-medium text-white hover:bg-wine-dark disabled:opacity-60"
      >
        {loading ? "Reactivando..." : "Reactivar pedido"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
