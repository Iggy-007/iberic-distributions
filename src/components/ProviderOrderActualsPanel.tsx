"use client";

import { useState } from "react";
import Link from "next/link";
import {
  lineNeedsActuals,
  validateLineDraft,
  buildLineActualPayload,
} from "@/lib/line-actuals";
import type { KanbanOrder } from "@/lib/kanban-types";
import { canCancelOrder } from "@/lib/order-groups";
import { CancelOrderButton } from "@/components/CancelOrderButton";
import {
  ProviderLineActualFields,
  lineToDraft,
  type LineDraft,
} from "@/components/ProviderLineActualFields";
import { Drawer } from "@/components/ui/Drawer";
import { Alert } from "@/components/ui/Alert";
import { btnPrimary, btnSecondary } from "@/lib/ui-classes";

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
      if (
        validationError &&
        lineNeedsActuals(
          line.variant.name,
          line.variant.product.name,
          line.variant.presentation
        )
      ) {
        setError(validationError);
        setLoading(false);
        return;
      }
    }

    const payload = {
      lines: order.lines
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
    <Drawer
      title={`Pedido #${order.orderNumber}`}
      subtitle={
        isCancelled
          ? `${order.clientOrg.name} · Cancelado`
          : order.clientOrg.name
      }
      onClose={onClose}
      footer={
        <div className="space-y-3">
          {error && <Alert variant="error">{error}</Alert>}
          {canCancelOrder(order.status) && (
            <CancelOrderButton
              orderId={order.id}
              status={order.status}
              onCancelled={onSaved}
            />
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={loading}
              className={btnPrimary + " flex-1"}
            >
              {loading ? "Guardando..." : "Guardar datos reales"}
            </button>
            <Link
              href={`/provider/orders/${order.id}`}
              className={btnSecondary}
            >
              Ver detalle
            </Link>
          </div>
        </div>
      }
    >
      <p className="text-xs text-stone-500 mb-4">
        Loncheado y plateado requieren peso del jamón y paquetes/platos reales.
      </p>
      {isCancelled && (
        <p className="mb-4 text-xs font-medium text-stone-600">
          Pedido cancelado — puede reactivar desde el detalle.
        </p>
      )}
      <div className="space-y-4">
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
    </Drawer>
  );
}
