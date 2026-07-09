"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PriceType } from "@prisma/client";
import { formatEuros, getShippingCostCents, resolveShippingType } from "@/lib/shipping";
import { formatVariantPrice, formatVatPercentLabel } from "@/lib/pricing";
import {
  buildOrderEstimate,
  getVariantKind,
  getVariantOrderHint,
} from "@/lib/order-estimates";
import {
  formatEstimatedPriceForUnits,
} from "@/lib/estimated-prices";

interface Variant {
  id: string;
  name: string;
  unitLabel: string;
  priceCents: number;
  priceType: PriceType;
  vatRate: number;
  product: { id: string; name: string };
}

interface CartLine {
  variantId: string;
  quantity: number;
}

const emptyFinalClient = {
  finalClientFirstName: "",
  finalClientLastName: "",
  finalClientStreet: "",
  finalClientCity: "",
  finalClientPostalCode: "",
  finalClientCountry: "España",
  finalClientPhone: "",
  finalClientPhoneSecondary: "",
  finalClientEmail: "",
};

export function NewOrderForm({ variants }: { variants: Variant[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [destinationType, setDestinationType] = useState<
    "CLIENT_WAREHOUSE" | "FINAL_CLIENT"
  >("CLIENT_WAREHOUSE");
  const [finalClient, setFinalClient] = useState(emptyFinalClient);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getQty(variantId: string) {
    return cart.find((c) => c.variantId === variantId)?.quantity ?? 0;
  }

  function setQty(variantId: string, quantity: number) {
    setCart((prev) => {
      const rest = prev.filter((c) => c.variantId !== variantId);
      if (quantity <= 0) return rest;
      return [...rest, { variantId, quantity }];
    });
  }

  function updateFinalClient(field: keyof typeof emptyFinalClient, value: string) {
    setFinalClient((prev) => ({ ...prev, [field]: value }));
  }

  const estimate = buildOrderEstimate(cart, variants);

  const country =
    destinationType === "CLIENT_WAREHOUSE"
      ? "España"
      : finalClient.finalClientCountry;
  const shippingType = resolveShippingType(country);
  const shipping = getShippingCostCents(shippingType);
  const totalEstimate = estimate.subtotalWithVatCents + shipping;

  const subtotalByRate = estimate.lines.reduce((acc, line) => {
    acc.set(
      line.vatRate,
      (acc.get(line.vatRate) ?? 0) + line.subtotalCents
    );
    return acc;
  }, new Map<number, number>());

  const vatByRate = estimate.lines.reduce((acc, line) => {
    acc.set(line.vatRate, (acc.get(line.vatRate) ?? 0) + line.vatCents);
    return acc;
  }, new Map<number, number>());

  const sortedVatRates = [...new Set(estimate.lines.map((l) => l.vatRate))].sort(
    (a, b) => a - b
  );

  function canProceedFromFinalClient() {
    return (
      finalClient.finalClientFirstName.trim() &&
      finalClient.finalClientLastName.trim() &&
      finalClient.finalClientStreet.trim() &&
      finalClient.finalClientCity.trim() &&
      finalClient.finalClientPostalCode.trim() &&
      finalClient.finalClientCountry.trim() &&
      finalClient.finalClientPhone.trim()
    );
  }

  async function submit() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: cart,
        destinationType,
        ...finalClient,
        finalClientPhoneSecondary:
          finalClient.finalClientPhoneSecondary || undefined,
        finalClientEmail: finalClient.finalClientEmail || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear pedido");
      return;
    }

    const order = await res.json();
    router.push(`/client/orders/${order.id}`);
    router.refresh();
  }

  const finalClientFullName = [
    finalClient.finalClientFirstName,
    finalClient.finalClientLastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded ${step >= s ? "bg-wine" : "bg-stone-200"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">1. Productos</h2>
          {variants.map((v) => {
            const hint = getVariantOrderHint(getVariantKind(v.name));
            const qty = getQty(v.id);
            const priceFormula =
              qty > 0 ? formatEstimatedPriceForUnits(v, qty) : null;
            return (
            <div
              key={v.id}
              className="rounded-xl border border-stone-200 bg-white p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{v.product.name}</p>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {v.name} — {formatVariantPrice(v)}
                  </p>
                  {hint && (
                    <p className="text-xs text-stone-400 mt-2">{hint}</p>
                  )}
                  {priceFormula && (
                    <p className="text-xs font-medium text-stone-600 mt-1">
                      {priceFormula}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-stone-500">unid.</span>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={getQty(v.id) || ""}
                    onChange={(e) =>
                      setQty(v.id, parseInt(e.target.value, 10) || 0)
                    }
                    className="w-20 rounded-lg border border-stone-300 px-2 py-1.5 text-center"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            );
          })}
          <button
            type="button"
            onClick={() => {
              if (cart.length > 0) setStep(2);
            }}
            disabled={cart.length === 0}
            className="rounded-lg bg-wine px-5 py-2.5 text-white disabled:opacity-50"
          >
            Siguiente: Cliente final
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">2. Cliente final</h2>
          <p className="text-sm text-stone-600">
            Datos del cliente al que va destinado el pedido (comprador final).
          </p>
          <div className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Nombre *"
                value={finalClient.finalClientFirstName}
                onChange={(e) =>
                  updateFinalClient("finalClientFirstName", e.target.value)
                }
                className="rounded-lg border border-stone-300 px-3 py-2"
              />
              <input
                placeholder="Apellidos *"
                value={finalClient.finalClientLastName}
                onChange={(e) =>
                  updateFinalClient("finalClientLastName", e.target.value)
                }
                className="rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>
            <input
              placeholder="Dirección *"
              value={finalClient.finalClientStreet}
              onChange={(e) =>
                updateFinalClient("finalClientStreet", e.target.value)
              }
              className="rounded-lg border border-stone-300 px-3 py-2"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Ciudad *"
                value={finalClient.finalClientCity}
                onChange={(e) =>
                  updateFinalClient("finalClientCity", e.target.value)
                }
                className="rounded-lg border border-stone-300 px-3 py-2"
              />
              <input
                placeholder="Código postal *"
                value={finalClient.finalClientPostalCode}
                onChange={(e) =>
                  updateFinalClient("finalClientPostalCode", e.target.value)
                }
                className="rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>
            <input
              placeholder="País *"
              value={finalClient.finalClientCountry}
              onChange={(e) =>
                updateFinalClient("finalClientCountry", e.target.value)
              }
              className="rounded-lg border border-stone-300 px-3 py-2"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Teléfono *"
                value={finalClient.finalClientPhone}
                onChange={(e) =>
                  updateFinalClient("finalClientPhone", e.target.value)
                }
                className="rounded-lg border border-stone-300 px-3 py-2"
              />
              <input
                placeholder="Teléfono contacto 2 (opcional)"
                value={finalClient.finalClientPhoneSecondary}
                onChange={(e) =>
                  updateFinalClient("finalClientPhoneSecondary", e.target.value)
                }
                className="rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>
            <input
              type="email"
              placeholder="Email (opcional)"
              value={finalClient.finalClientEmail}
              onChange={(e) =>
                updateFinalClient("finalClientEmail", e.target.value)
              }
              className="rounded-lg border border-stone-300 px-3 py-2"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="rounded-lg border border-stone-300 px-5 py-2.5"
            >
              Atrás
            </button>
            <button
              onClick={() => canProceedFromFinalClient() && setStep(3)}
              disabled={!canProceedFromFinalClient()}
              className="rounded-lg bg-wine px-5 py-2.5 text-white disabled:opacity-50"
            >
              Siguiente: Envío
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">3. Envío</h2>
          <p className="text-sm text-stone-600">
            Cliente final: <strong>{finalClientFullName}</strong>
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 cursor-pointer">
              <input
                type="radio"
                checked={destinationType === "CLIENT_WAREHOUSE"}
                onChange={() => setDestinationType("CLIENT_WAREHOUSE")}
              />
              <span>Sake Team Food — Málaga (almacén)</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 cursor-pointer">
              <input
                type="radio"
                checked={destinationType === "FINAL_CLIENT"}
                onChange={() => setDestinationType("FINAL_CLIENT")}
              />
              <span>
                Enviar a dirección del cliente final ({finalClientFullName})
              </span>
            </label>
          </div>

          {destinationType === "FINAL_CLIENT" && (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
              <p className="font-medium text-stone-900">Dirección de envío</p>
              <p className="mt-1">
                {finalClient.finalClientStreet}
                <br />
                {finalClient.finalClientPostalCode} {finalClient.finalClientCity}
                <br />
                {finalClient.finalClientCountry}
              </p>
            </div>
          )}

          <p className="text-sm text-stone-600">
            Envío {shippingType === "NATIONAL" ? "nacional" : "internacional"}:{" "}
            <strong>{formatEuros(shipping)}</strong>
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="rounded-lg border border-stone-300 px-5 py-2.5"
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(4)}
              className="rounded-lg bg-wine px-5 py-2.5 text-white"
            >
              Siguiente: Resumen
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">4. Resumen estimado</h2>
          <p className="text-sm text-stone-500">
            Los importes son orientativos. El cobro final se realizará por kilos
            reales en jamón y lomito enteros.
          </p>
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-2 text-sm">
            <p className="font-medium text-stone-900">Cliente final</p>
            <p className="text-stone-600">
              {finalClientFullName}
              <br />
              {finalClient.finalClientPhone}
              {finalClient.finalClientPhoneSecondary &&
                ` · ${finalClient.finalClientPhoneSecondary}`}
            </p>
            <p className="font-medium text-stone-900 pt-2">Envío</p>
            <p className="text-stone-600">
              {destinationType === "CLIENT_WAREHOUSE"
                ? "Sake Team Food — Málaga (almacén)"
                : `${finalClient.finalClientStreet}, ${finalClient.finalClientPostalCode} ${finalClient.finalClientCity}`}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
            {estimate.lines.map((line) => (
              <div key={line.key} className="border-b border-stone-100 pb-3 space-y-1">
                <p className="text-sm font-medium text-stone-900">
                  {line.productName} — {line.variantName}{" "}
                  <span className="font-normal text-stone-500">
                    ({line.quantityLabel})
                  </span>
                </p>
                {line.priceFormula && (
                  <p className="text-xs text-stone-500">{line.priceFormula}</p>
                )}
                <div className="grid gap-0.5 text-xs text-stone-600 sm:text-sm">
                  <div className="flex justify-between">
                    <span>sin IVA</span>
                    <span>{formatEuros(line.subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA ({formatVatPercentLabel(line.vatRate)})</span>
                    <span>{formatEuros(line.vatCents)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-stone-900 pt-0.5">
                    <span>con IVA</span>
                    <span>{formatEuros(line.totalWithVatCents)}</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="space-y-1 text-sm pt-1 border-t border-stone-200">
              {sortedVatRates.map((rate) => (
                <div
                  key={`base-${rate}`}
                  className="flex justify-between text-stone-600 pl-2"
                >
                  <span>Base imponible ({formatVatPercentLabel(rate)})</span>
                  <span>{formatEuros(subtotalByRate.get(rate) ?? 0)}</span>
                </div>
              ))}
              <div className="flex justify-between font-medium text-stone-900 pt-0.5">
                <span>Subtotal (sin IVA)</span>
                <span>{formatEuros(estimate.subtotalCents)}</span>
              </div>
              {sortedVatRates.map((rate) => (
                <div
                  key={`vat-${rate}`}
                  className="flex justify-between text-stone-600 pl-2"
                >
                  <span>IVA ({formatVatPercentLabel(rate)})</span>
                  <span>{formatEuros(vatByRate.get(rate) ?? 0)}</span>
                </div>
              ))}
              <div className="flex justify-between font-medium text-stone-900">
                <span>Total IVA</span>
                <span>{formatEuros(estimate.vatCents)}</span>
              </div>
              <div className="flex justify-between font-semibold text-stone-900 pt-1 border-t border-stone-100">
                <span>Subtotal (con IVA)</span>
                <span>{formatEuros(estimate.subtotalWithVatCents)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Envío estimado</span>
                <span>{formatEuros(shipping)}</span>
              </div>
              <div className="flex justify-between font-semibold text-stone-900 pt-1 border-t border-stone-200">
                <span>Total estimado</span>
                <span>{formatEuros(totalEstimate)}</span>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(3)}
              className="rounded-lg border border-stone-300 px-5 py-2.5"
            >
              Atrás
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="rounded-lg bg-wine px-5 py-2.5 text-white disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Confirmar pedido"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
