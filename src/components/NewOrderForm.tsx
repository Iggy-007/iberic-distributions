"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatEuros, resolveShippingType } from "@/lib/shipping";
import type { ShippingRates } from "@/lib/shipping-rates";
import { buildOrderEstimate } from "@/lib/order-estimates";
import {
  OrderProductPicker,
  type OrderVariant,
} from "@/components/OrderProductPicker";
import { OrderFinancialSummary } from "@/components/OrderFinancialSummary";

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

export function NewOrderForm({
  variants,
  shippingRates,
}: {
  variants: OrderVariant[];
  shippingRates: ShippingRates;
}) {
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
  const shipping =
    shippingType === "NATIONAL"
      ? shippingRates.nationalCents
      : shippingRates.internationalCents;
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
    <div className="max-w-3xl">
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
          <div>
            <h2 className="text-lg font-semibold">1. Productos y servicios</h2>
            <p className="text-sm text-stone-500 mt-1">
              Elija cantidades por producto (unidad) o por servicio de loncheado
              y plateado sobre el producto entero.
            </p>
          </div>

          <OrderProductPicker
            variants={variants}
            getQty={getQty}
            setQty={setQty}
          />

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
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <OrderFinancialSummary
              lines={estimate.lines}
              shippingCostCents={shipping}
              shippingLabel="Gastos de envío (estimado)"
              isEstimate
            />
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
