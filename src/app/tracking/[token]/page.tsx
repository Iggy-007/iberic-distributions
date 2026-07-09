"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Logo } from "@/components/Logo";

interface TrackingData {
  orderNumber: string;
  statusLabel: string;
  destinationCity: string | null;
  destinationCountry: string;
  products: { name: string; quantity: number }[];
  subtotal: string;
  vat: string;
  vatLabel: string;
  shipping: string;
  total: string;
  timeline: { label: string; date: string }[];
  carrier: {
    company: string | null;
    trackingNumber: string | null;
    phone: string | null;
  } | null;
}

export default function TrackingPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/tracking/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Enlace no válido");
        }
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);

  return (
    <div className="min-h-screen bg-cream px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo size="md" />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            {error}
          </div>
        )}

        {data && (
          <div className="rounded-xl border border-stone-200 bg-white p-6 space-y-6">
            <div className="text-center">
              <p className="text-sm text-stone-500">Seguimiento de pedido</p>
              <h1 className="text-xl font-bold text-stone-900 mt-1">
                #{data.orderNumber}
              </h1>
              <span className="inline-block mt-3 rounded-full bg-wine/10 px-3 py-1 text-sm font-medium text-wine">
                {data.statusLabel}
              </span>
            </div>

            <div className="text-sm text-stone-600 text-center">
              Destino: {data.destinationCity}, {data.destinationCountry}
            </div>

            {data.carrier && (
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
                <h2 className="font-medium text-stone-900 mb-2">Transportista</h2>
                {data.carrier.company && (
                  <p>
                    <span className="text-stone-500">Empresa: </span>
                    {data.carrier.company}
                  </p>
                )}
                {data.carrier.trackingNumber && (
                  <p className="mt-1">
                    <span className="text-stone-500">Nº seguimiento: </span>
                    <span className="font-medium break-all">
                      {data.carrier.trackingNumber}
                    </span>
                  </p>
                )}
                {data.carrier.phone && (
                  <p className="mt-1">
                    <span className="text-stone-500">Teléfono: </span>
                    {data.carrier.phone}
                  </p>
                )}
              </div>
            )}

            <div>
              <h2 className="font-medium mb-2">Productos</h2>
              <ul className="text-sm space-y-1">
                {data.products.map((p, i) => (
                  <li key={i}>
                    {p.name} x{p.quantity}
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal (sin IVA)</span>
                  <span>{data.subtotal}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>{data.vatLabel}</span>
                  <span>{data.vat}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Envío</span>
                  <span>{data.shipping}</span>
                </div>
                <div className="flex justify-between font-medium pt-1 border-t">
                  <span>Total</span>
                  <span>{data.total}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-medium mb-3">Historial</h2>
              <ol className="space-y-3">
                {data.timeline.map((t, i) => (
                  <li key={i} className="text-sm">
                    <p className="font-medium">{t.label}</p>
                    <p className="text-stone-500">
                      {new Date(t.date).toLocaleString("es-ES")}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {!data && !error && (
          <p className="text-center text-stone-500">Cargando seguimiento...</p>
        )}
      </div>
    </div>
  );
}
