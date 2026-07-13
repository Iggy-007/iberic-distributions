"use client";

import { useMemo, useState } from "react";
import { ShippingType } from "@prisma/client";
import type { ShippingService } from "@/lib/shipping-rates";
import { formatEuros, shippingTypeLabel } from "@/lib/shipping";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";

type Draft = {
  label: string;
  priceEuros: string;
  supplier: string;
  type: ShippingType;
};

const emptyDraft = (): Draft => ({
  label: "",
  priceEuros: "6.00",
  supplier: "",
  type: ShippingType.NATIONAL,
});

function eurosToCents(value: string): number | null {
  const cents = Math.round(parseFloat(value.replace(",", ".")) * 100);
  if (Number.isNaN(cents) || cents < 0) return null;
  return cents;
}

export function ShippingServicesEditor({
  initialServices,
}: {
  initialServices: ShippingService[];
}) {
  const [services, setServices] = useState(initialServices);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [showAdd, setShowAdd] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const grouped = useMemo(() => {
    return {
      [ShippingType.NATIONAL]: services.filter(
        (s) => s.type === ShippingType.NATIONAL
      ),
      [ShippingType.INTERNATIONAL]: services.filter(
        (s) => s.type === ShippingType.INTERNATIONAL
      ),
    };
  }, [services]);

  async function createService() {
    setCreating(true);
    setError("");
    setMessage("");

    const priceCents = eurosToCents(draft.priceEuros);
    if (!draft.label.trim() || priceCents === null) {
      setCreating(false);
      setError("Complete nombre e importe válidos");
      return;
    }

    const res = await fetch("/api/shipping-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: draft.type,
        label: draft.label.trim(),
        priceCents,
        supplier: draft.supplier.trim(),
      }),
    });

    setCreating(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo crear el servicio");
      return;
    }

    const created = (await res.json()) as ShippingService;
    setServices((prev) => {
      const next = [...prev, created];
      if (created.isDefault) {
        return next.map((s) =>
          s.type === created.type && s.id !== created.id
            ? { ...s, isDefault: false }
            : s
        );
      }
      return next;
    });
    setDraft(emptyDraft());
    setShowAdd(false);
    setMessage("Servicio de envío añadido.");
  }

  async function saveService(service: ShippingService, updates: Partial<Draft> & { isDefault?: boolean; active?: boolean }) {
    setSavingId(service.id);
    setError("");
    setMessage("");

    const priceCents =
      updates.priceEuros !== undefined
        ? eurosToCents(updates.priceEuros)
        : service.priceCents;
    if (priceCents === null) {
      setSavingId(null);
      setError("Importe no válido");
      return;
    }

    const res = await fetch(`/api/shipping-rates/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: updates.label ?? service.label,
        priceCents,
        supplier: updates.supplier ?? service.supplier,
        isDefault: updates.isDefault,
        active: updates.active,
      }),
    });

    setSavingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo guardar");
      return;
    }

    const updated = (await res.json()) as ShippingService;
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === updated.id) return updated;
        if (updated.isDefault && s.type === updated.type) {
          return { ...s, isDefault: false };
        }
        return s;
      })
    );
    setMessage("Servicio guardado.");
  }

  async function removeService(service: ShippingService) {
    if (
      !confirm(
        `¿Eliminar «${service.label}»? Si hay pedidos asociados se desactivará.`
      )
    ) {
      return;
    }

    setSavingId(service.id);
    setError("");
    setMessage("");

    const res = await fetch(`/api/shipping-rates/${service.id}`, {
      method: "DELETE",
    });

    setSavingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo eliminar");
      return;
    }

    setServices((prev) => prev.filter((s) => s.id !== service.id));
    setMessage("Servicio eliminado o desactivado.");
  }

  return (
    <CollapsibleSection
      title="Servicios de envío"
      subtitle="Servicios del pedido — nacional e internacional"
      defaultOpen={false}
      className="border-blue-200 bg-blue-50/40"
      headerClassName="bg-blue-50/40"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-sm text-stone-600 max-w-2xl">
            Defina uno o varios servicios por ámbito (nacional / internacional).
            El cliente elegirá entre los activos al crear el pedido; el marcado
            como predeterminado se preselecciona.
          </p>
          <button
            type="button"
            onClick={() => {
              setShowAdd((v) => !v);
              setError("");
            }}
            className="rounded-lg bg-wine px-4 py-2 text-sm text-white"
          >
            {showAdd ? "Cancelar" : "+ Nuevo servicio"}
          </button>
        </div>

      {showAdd && (
        <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-3">
          <h3 className="font-medium text-stone-900">Nuevo servicio de envío</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-stone-700">Nombre del servicio</span>
              <input
                type="text"
                value={draft.label}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, label: e.target.value }))
                }
                placeholder="Ej. Envío urgente 24h"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-stone-700">Ámbito</span>
              <select
                value={draft.type}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    type: e.target.value as ShippingType,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 bg-white"
              >
                <option value={ShippingType.NATIONAL}>
                  {shippingTypeLabel(ShippingType.NATIONAL)}
                </option>
                <option value={ShippingType.INTERNATIONAL}>
                  {shippingTypeLabel(ShippingType.INTERNATIONAL)}
                </option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-stone-700">Precio (€)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={draft.priceEuros}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, priceEuros: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-stone-700">
                Proveedor (opcional)
              </span>
              <input
                type="text"
                value={draft.supplier}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, supplier: e.target.value }))
                }
                placeholder="Ej. MRW, Seur, transporte propio"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={createService}
            disabled={creating}
            className="rounded-lg bg-wine px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {creating ? "Creando..." : "Añadir servicio"}
          </button>
        </div>
      )}

      {([ShippingType.NATIONAL, ShippingType.INTERNATIONAL] as const).map(
        (type) => (
          <ServiceGroup
            key={type}
            type={type}
            services={grouped[type]}
            savingId={savingId}
            onSave={saveService}
            onRemove={removeService}
          />
        )
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
      </div>
    </CollapsibleSection>
  );
}

function ServiceGroup({
  type,
  services,
  savingId,
  onSave,
  onRemove,
}: {
  type: ShippingType;
  services: ShippingService[];
  savingId: string | null;
  onSave: (
    service: ShippingService,
    updates: Partial<Draft> & { isDefault?: boolean; active?: boolean }
  ) => Promise<void>;
  onRemove: (service: ShippingService) => Promise<void>;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-stone-800">
        {shippingTypeLabel(type)}
      </h3>
      {services.length === 0 ? (
        <p className="text-sm text-stone-500 rounded-lg border border-dashed border-stone-300 bg-white px-4 py-3">
          No hay servicios en este ámbito. Añada uno con el botón superior.
        </p>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <ServiceRow
              key={service.id}
              service={service}
              saving={savingId === service.id}
              onSave={onSave}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceRow({
  service,
  saving,
  onSave,
  onRemove,
}: {
  service: ShippingService;
  saving: boolean;
  onSave: (
    service: ShippingService,
    updates: Partial<Draft> & { isDefault?: boolean; active?: boolean }
  ) => Promise<void>;
  onRemove: (service: ShippingService) => Promise<void>;
}) {
  const [label, setLabel] = useState(service.label);
  const [priceEuros, setPriceEuros] = useState(
    (service.priceCents / 100).toFixed(2)
  );
  const [supplier, setSupplier] = useState(service.supplier);

  return (
    <div
      className={`rounded-lg border bg-white p-4 space-y-3 ${
        service.active ? "border-stone-200" : "border-stone-200 opacity-60"
      }`}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-stone-700">Nombre</span>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-700">Precio (€)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={priceEuros}
            onChange={(e) => setPriceEuros(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-700">Proveedor</span>
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={service.isDefault}
            onChange={(e) =>
              onSave(service, { isDefault: e.target.checked })
            }
            disabled={saving || !service.active}
          />
          <span>Predeterminado</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={service.active}
            onChange={(e) => onSave(service, { active: e.target.checked })}
            disabled={saving}
          />
          <span>Activo</span>
        </label>
        <span className="text-stone-500">
          Vista: {formatEuros(Math.round(parseFloat(priceEuros.replace(",", ".")) * 100) || service.priceCents)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            onSave(service, { label, priceEuros, supplier })
          }
          disabled={saving}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => onRemove(service)}
          disabled={saving}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
