"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  lineNeedsActuals,
  orderHasRequiredActuals,
  validateLineDraft,
  buildLineActualPayload,
} from "@/lib/line-actuals";
import type { KanbanOrderLine } from "@/lib/kanban-types";
import {
  ProviderLineActualFields,
  lineToDraft,
  type LineDraft,
} from "@/components/ProviderLineActualFields";

export function ProviderLineActualsEditor({
  orderId,
  lines,
  cancelled = false,
}: {
  orderId: string;
  lines: KanbanOrderLine[];
  cancelled?: boolean;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<LineDraft[]>(lines.map(lineToDraft));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const needsData = lines.some((line) =>
    lineNeedsActuals(
      line.variant.name,
      line.variant.product.name,
      line.variant.presentation
    )
  );

  if (!needsData) return null;

  function updateDraft(
    lineId: string,
    field: keyof Omit<LineDraft, "lineId">,
    value: string
  ) {
    setDrafts((prev) =>
      prev.map((d) => (d.lineId === lineId ? { ...d, [field]: value } : d))
    );
    setSuccess(false);
  }

  async function save() {
    setLoading(true);
    setError("");
    setSuccess(false);

    for (const line of lines) {
      if (
        !lineNeedsActuals(
          line.variant.name,
          line.variant.product.name,
          line.variant.presentation
        )
      )
        continue;
      const draft = drafts.find((d) => d.lineId === line.id)!;
      const validationError = validateLineDraft(line, draft);
      if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
      }
    }

    const payload = {
      lines: lines
        .filter((line) =>
          lineNeedsActuals(
            line.variant.name,
            line.variant.product.name,
            line.variant.presentation
          )
        )
        .map((line) => {
          const draft = drafts.find((d) => d.lineId === line.id)!;
          const built = buildLineActualPayload(line, draft);
          return { ...built, lineId: line.id };
        }),
    };

    const res = await fetch(`/api/orders/${orderId}/lines`, {
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

    setSuccess(true);
    router.refresh();
  }

  const allComplete = orderHasRequiredActuals(lines);

  return (
    <section
      className={`rounded-xl border p-5 ${
        cancelled
          ? "border-stone-300 bg-stone-50"
          : "border-amber-200 bg-amber-50/40"
      }`}
    >
      <h2 className="font-semibold text-stone-900 mb-1">
        Datos reales del pedido
      </h2>
      <p className="text-sm text-stone-600 mb-4">
        {cancelled
          ? "Pedido cancelado. Puede actualizar los datos o reactivarlo más abajo."
          : allComplete
            ? "Datos completos. Puede mover el pedido en el tablero Kanban."
            : "Obligatorio antes de avanzar el pedido. Loncheado y plateado requieren peso del jamón y paquetes/platos."}
      </p>
      <div className="space-y-3">
        {lines.map((line) => {
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
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Datos guardados correctamente.
        </p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={loading}
        className="mt-4 rounded-lg bg-wine px-5 py-2.5 font-medium text-white disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Guardar datos reales"}
      </button>
    </section>
  );
}
