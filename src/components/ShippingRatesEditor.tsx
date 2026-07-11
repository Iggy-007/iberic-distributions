"use client";

import { useState } from "react";
import type { ShippingRates } from "@/lib/shipping-rates";
import { formatEuros } from "@/lib/shipping";

export function ShippingRatesEditor({
  initialRates,
}: {
  initialRates: ShippingRates;
}) {
  const [nationalEuros, setNationalEuros] = useState(
    (initialRates.nationalCents / 100).toFixed(2)
  );
  const [internationalEuros, setInternationalEuros] = useState(
    (initialRates.internationalCents / 100).toFixed(2)
  );
  const [supplier, setSupplier] = useState(initialRates.supplier ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);

    const nationalCents = Math.round(
      parseFloat(nationalEuros.replace(",", ".")) * 100
    );
    const internationalCents = Math.round(
      parseFloat(internationalEuros.replace(",", ".")) * 100
    );

    if (
      Number.isNaN(nationalCents) ||
      Number.isNaN(internationalCents) ||
      nationalCents < 0 ||
      internationalCents < 0
    ) {
      setSaving(false);
      setError("Introduzca importes válidos");
      return;
    }

    const res = await fetch("/api/shipping-rates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nationalCents,
        internationalCents,
        supplier: supplier.trim(),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo guardar el servicio de envío");
      return;
    }

    setSaved(true);
  }

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
          Servicio del pedido
        </p>
        <h2 className="text-lg font-semibold text-stone-900 mt-1">
          Servicio de envío
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          Servicio adicional aplicado al pedido completo (no forma parte del
          producto). Se calcula según destino nacional o internacional.
        </p>
      </div>
      <label className="block text-sm">
        <span className="font-medium text-stone-700">Proveedor del servicio</span>
        <input
          type="text"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Ej. empresa de transporte o logística"
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-stone-700">Nacional (España)</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              value={nationalEuros}
              onChange={(e) => setNationalEuros(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
            />
            <span className="text-stone-500">€</span>
          </div>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-700">Internacional</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              value={internationalEuros}
              onChange={(e) => setInternationalEuros(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
            />
            <span className="text-stone-500">€</span>
          </div>
        </label>
      </div>
      <p className="text-xs text-stone-500">
        Vista previa: nacional{" "}
        {formatEuros(
          Math.round(parseFloat(nationalEuros.replace(",", ".")) * 100) || 0
        )}{" "}
        · internacional{" "}
        {formatEuros(
          Math.round(parseFloat(internationalEuros.replace(",", ".")) * 100) ||
            0
        )}
        {supplier.trim() && ` · Proveedor: ${supplier.trim()}`}
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && (
        <p className="text-sm text-green-700">Servicio de envío guardado.</p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-wine px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar servicio de envío"}
      </button>
    </section>
  );
}
