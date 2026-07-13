"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { OrderFinancialSummary } from "@/components/OrderFinancialSummary";
import type { EstimateLineItem } from "@/lib/order-estimates";

interface TrackingData {
  orderNumber: string;
  statusLabel: string;
  destinationCity: string | null;
  destinationCountry: string;
  financial: {
    lines: EstimateLineItem[];
    shippingCostCents: number;
  };
  timeline: { label: string; date: string }[];
  carrier: {
    company: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
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
                {data.carrier.trackingUrl && (
                  <p className="mt-1">
                    <span className="text-stone-500">Seguimiento online: </span>
                    <a
                      href={data.carrier.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-wine hover:underline break-all"
                    >
                      Ver envío en la web del transportista
                    </a>
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
              <h2 className="font-medium mb-3">Importe del pedido</h2>
              <OrderFinancialSummary
                lines={data.financial.lines}
                shippingCostCents={data.financial.shippingCostCents}
              />
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
          <div className="rounded-xl border border-stone-200 bg-white p-6 space-y-4 animate-pulse">
            <div className="mx-auto h-6 w-40 rounded bg-stone-200" />
            <div className="mx-auto h-8 w-32 rounded bg-stone-200" />
            <div className="h-24 rounded-lg bg-stone-100" />
            <div className="h-32 rounded-lg bg-stone-100" />
          </div>
        )}
      </div>
    </div>
  );
}
