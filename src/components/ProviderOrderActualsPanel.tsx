"use client";

import { useState } from "react";
import Link from "next/link";
import {
  lineNeedsActuals,
  validateLineDraft,
  buildLineActualPayload,
} from "@/lib/line-actuals";
import type { KanbanOrder } from "@/lib/kanban-types";
import {
  ProviderLineActualFields,
  lineToDraft,
  type LineDraft,
} from "@/components/ProviderLineActualFields";

export function ProviderOrderActualsPanel({
  order,
  onClose,
  onSaved,
}: {
  order: KanbanOrder;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [drafts, setDrafts] = useState<LineDraft[]>(
    order.lines.map(lineToDraft)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isCancelled = order.status === "CANCELLED";

  function updateDraft(
    lineId: string,
    field: keyof Omit<LineDraft, "lineId">,
    value: string
  ) {
    setDrafts((prev) =>
      prev.map((d) => (d.lineId === lineId ? { ...d, [field]: value } : d))
    );
  }

  async function save() {
    setLoading(true);
    setError("");

    for (const line of order.lines) {
      const draft = drafts.find((d) => d.lineId === line.id)!;
      const validationError = validateLineDraft(line, draft);
      if (validationError && lineNeedsActuals(line.variant.name)) {
        setError(validationError);
        setLoading(false);
        return;
      }
    }

    const payload = {
      lines: order.lines
        .filter((line) => lineNeedsActuals(line.variant.name))
        .map((line) => {
          const draft = drafts.find((d) => d.lineId === line.id)!;
          const built = buildLineActualPayload(line, draft);
          return { ...built, lineId: line.id };
        }),
    };

    if (payload.lines.length === 0) {
      setLoading(false);
      onSaved();
      return;
    }

    const res = await fetch(`/api/orders/${order.id}/lines`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar");
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        <header className="border-b border-stone-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">
                Pedido #{order.orderNumber}
              </h2>
              <p className="text-sm text-stone-500">{order.clientOrg.name}</p>
              {isCancelled && (
                <p className="mt-1 text-xs font-medium text-stone-600">
                  Pedido cancelado — puede editar datos o reactivar desde el
                  detalle.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-stone-500 hover:bg-stone-100"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Loncheado y plateado requieren peso del jamón y paquetes/platos
            reales. Doble clic en la tarjeta abre el detalle.
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {order.lines.map((line) => {
            const draft = drafts.find((d) => d.lineId === line.id)!;
            return (
              <ProviderLineActualFields
                key={line.id}
                line={line}
                draft={draft}
                onUpdate={(field, value) => updateDraft(line.id, field, value)}
              />
            );
          })}
        </div>

        <footer className="border-t border-stone-200 px-5 py-4 space-y-3">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={loading}
              className="flex-1 rounded-lg bg-wine px-4 py-2.5 font-medium text-white hover:bg-wine-dark disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Guardar datos reales"}
            </button>
            <Link
              href={`/provider/orders/${order.id}`}
              className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              Ver detalle
            </Link>
          </div>
        </footer>
      </aside>
    </div>
  );
}
