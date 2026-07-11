"use client";

import { useState } from "react";
import {
  validateCarrierForm,
  type CarrierFormValues,
  type CarrierInfo,
} from "@/lib/carrier";

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-wine focus:outline-none focus:ring-1 focus:ring-wine";

export function ProviderShipmentForm({
  orderId,
  initial,
  onSuccess,
  onCancel,
  submitLabel = "Confirmar envío",
}: {
  orderId: string;
  initial?: CarrierInfo;
  onSuccess: () => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<CarrierFormValues>({
    carrierCompany: initial?.carrierCompany ?? "",
    carrierTrackingNumber: initial?.carrierTrackingNumber ?? "",
    carrierTrackingUrl: initial?.carrierTrackingUrl ?? "",
    carrierPhone: initial?.carrierPhone ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validateCarrierForm(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "SHIPPED_TO_FINAL",
        carrierCompany: values.carrierCompany.trim(),
        carrierTrackingNumber: values.carrierTrackingNumber.trim(),
        carrierTrackingUrl: values.carrierTrackingUrl.trim() || undefined,
        carrierPhone: values.carrierPhone.trim(),
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo registrar el envío");
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-stone-600">
        Complete los datos del transportista para pasar el pedido a «En envío».
      </p>
      <label className="block text-sm font-medium text-stone-700">
        Empresa de transporte
        <input
          type="text"
          required
          value={values.carrierCompany}
          onChange={(e) =>
            setValues((v) => ({ ...v, carrierCompany: e.target.value }))
          }
          className={inputClass}
          placeholder="Ej. SEUR, MRW..."
        />
      </label>
      <label className="block text-sm font-medium text-stone-700">
        Número de seguimiento
        <input
          type="text"
          required
          value={values.carrierTrackingNumber}
          onChange={(e) =>
            setValues((v) => ({ ...v, carrierTrackingNumber: e.target.value }))
          }
          className={inputClass}
          placeholder="Ej. 1234567890"
        />
      </label>
      <label className="block text-sm font-medium text-stone-700">
        Enlace seguimiento online
        <input
          type="url"
          value={values.carrierTrackingUrl}
          onChange={(e) =>
            setValues((v) => ({ ...v, carrierTrackingUrl: e.target.value }))
          }
          className={inputClass}
          placeholder="https://www.seur.com/seguimiento/..."
        />
        <span className="mt-1 block text-xs font-normal text-stone-500">
          Opcional. URL de la web del transportista para seguir el envío.
        </span>
      </label>
      <label className="block text-sm font-medium text-stone-700">
        Teléfono del transportista
        <input
          type="tel"
          required
          value={values.carrierPhone}
          onChange={(e) =>
            setValues((v) => ({ ...v, carrierPhone: e.target.value }))
          }
          className={inputClass}
          placeholder="Ej. +34 900 000 000"
        />
      </label>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-wine px-5 py-2.5 font-medium text-white hover:bg-wine-dark disabled:opacity-60"
        >
          {loading ? "Guardando..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-stone-300 px-5 py-2.5 text-stone-700 hover:bg-stone-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
