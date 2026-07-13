"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatEuros, resolveShippingType, shippingTypeLabel } from "@/lib/shipping";
import type { ShippingService } from "@/lib/shipping-rates";
import { buildOrderEstimate } from "@/lib/order-estimates";
import {
  OrderProductPicker,
  type OrderVariant,
} from "@/components/OrderProductPicker";
import { OrderFinancialSummary } from "@/components/OrderFinancialSummary";
import { Stepper } from "@/components/ui/Stepper";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { btnPrimary, btnSecondary } from "@/lib/ui-classes";
import { cn } from "@/lib/cn";

interface CartLine {
  variantId: string;
  quantity: number;
}

const STEPS = ["Productos", "Destino", "Cliente final", "Resumen"];

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
  shippingServices,
}: {
  variants: OrderVariant[];
  shippingServices: ShippingService[];
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
  const [selectedShippingServiceId, setSelectedShippingServiceId] = useState("");

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

  const availableShippingServices = useMemo(
    () => shippingServices.filter((s) => s.type === shippingType && s.active),
    [shippingServices, shippingType]
  );

  const selectedShippingService = useMemo(() => {
    return (
      availableShippingServices.find((s) => s.id === selectedShippingServiceId) ??
      availableShippingServices.find((s) => s.isDefault) ??
      availableShippingServices[0] ??
      null
    );
  }, [availableShippingServices, selectedShippingServiceId]);

  useEffect(() => {
    if (!selectedShippingService) {
      setSelectedShippingServiceId("");
      return;
    }
    setSelectedShippingServiceId(selectedShippingService.id);
  }, [selectedShippingService?.id, shippingType]);

  const shipping = selectedShippingService?.priceCents ?? 0;

  function canProceedFromDestino() {
    return !!selectedShippingService;
  }

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
        shippingServiceId: selectedShippingService?.id,
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
    <div className={cn("max-w-3xl", step === 1 && cart.length > 0 && "pb-24")}>
      <Stepper steps={STEPS} current={step} />

      {step === 1 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">1. Productos y servicios</h2>
            <p className="text-sm text-stone-500 mt-1">
              Elija cantidades por producto o por servicios combinables (loncheado
              y plateado).
            </p>
          </div>

          <OrderProductPicker variants={variants} getQty={getQty} setQty={setQty} />

          <Button
            onClick={() => cart.length > 0 && setStep(2)}
            disabled={cart.length === 0}
            className="hidden sm:inline-flex"
          >
            Siguiente: Destino
          </Button>

          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur px-4 py-3 shadow-lg sm:static sm:border-0 sm:bg-transparent sm:shadow-none sm:backdrop-blur-none sm:p-0">
              <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
                <div className="text-sm">
                  <p className="text-stone-500">
                    {cart.length} línea{cart.length !== 1 ? "s" : ""}
                  </p>
                  <p className="font-semibold text-stone-900">
                    Estimado: {formatEuros(estimate.subtotalWithVatCents)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={btnPrimary}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">2. Destino y envío</h2>
          <p className="text-sm text-stone-600">
            Indique dónde debe entregarse el pedido y el servicio de transporte.
          </p>

          <div className="space-y-2">
            <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 cursor-pointer min-h-[44px]">
              <input
                type="radio"
                name="destination"
                checked={destinationType === "CLIENT_WAREHOUSE"}
                onChange={() => setDestinationType("CLIENT_WAREHOUSE")}
              />
              <span>Sake Team Food — Málaga (almacén)</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 cursor-pointer min-h-[44px]">
              <input
                type="radio"
                name="destination"
                checked={destinationType === "FINAL_CLIENT"}
                onChange={() => setDestinationType("FINAL_CLIENT")}
              />
              <span>Enviar a dirección del cliente final (paso siguiente)</span>
            </label>
          </div>

          <p className="text-sm text-stone-600">
            Ámbito de envío: <strong>{shippingTypeLabel(shippingType)}</strong>
          </p>

          {availableShippingServices.length === 0 ? (
            <Alert variant="warning">
              No hay servicios de envío activos para este destino. Contacte con
              el administrador.
            </Alert>
          ) : availableShippingServices.length === 1 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
              <p className="font-medium text-stone-900">
                {availableShippingServices[0].label}
              </p>
              <p className="mt-1 text-stone-600">
                {formatEuros(availableShippingServices[0].priceCents)}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableShippingServices.map((service) => (
                <label
                  key={service.id}
                  className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-4 cursor-pointer min-h-[44px]"
                >
                  <input
                    type="radio"
                    name="shippingService"
                    checked={selectedShippingServiceId === service.id}
                    onChange={() => setSelectedShippingServiceId(service.id)}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-stone-900">
                      {service.label}
                      {service.isDefault && (
                        <span className="ml-2 text-xs text-stone-500">
                          (predeterminado)
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-stone-600">
                      {formatEuros(service.priceCents)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className={btnSecondary}>
              Atrás
            </button>
            <button
              type="button"
              onClick={() => canProceedFromDestino() && setStep(3)}
              disabled={!canProceedFromDestino()}
              className={btnPrimary}
            >
              Siguiente: Cliente final
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">3. Cliente final</h2>
          <p className="text-sm text-stone-600">
            Datos del comprador final — obligatorios para trazabilidad, aunque el
            envío sea a su almacén en Málaga.
          </p>
          <div className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="fc-first"
                label="Nombre *"
                value={finalClient.finalClientFirstName}
                onChange={(e) =>
                  updateFinalClient("finalClientFirstName", e.target.value)
                }
              />
              <Input
                id="fc-last"
                label="Apellidos *"
                value={finalClient.finalClientLastName}
                onChange={(e) =>
                  updateFinalClient("finalClientLastName", e.target.value)
                }
              />
            </div>
            <Input
              id="fc-street"
              label="Dirección *"
              value={finalClient.finalClientStreet}
              onChange={(e) =>
                updateFinalClient("finalClientStreet", e.target.value)
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="fc-city"
                label="Ciudad *"
                value={finalClient.finalClientCity}
                onChange={(e) =>
                  updateFinalClient("finalClientCity", e.target.value)
                }
              />
              <Input
                id="fc-postal"
                label="Código postal *"
                value={finalClient.finalClientPostalCode}
                onChange={(e) =>
                  updateFinalClient("finalClientPostalCode", e.target.value)
                }
              />
            </div>
            <Input
              id="fc-country"
              label="País *"
              value={finalClient.finalClientCountry}
              onChange={(e) =>
                updateFinalClient("finalClientCountry", e.target.value)
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="fc-phone"
                label="Teléfono *"
                value={finalClient.finalClientPhone}
                onChange={(e) =>
                  updateFinalClient("finalClientPhone", e.target.value)
                }
              />
              <Input
                id="fc-phone2"
                label="Teléfono contacto 2 (opcional)"
                value={finalClient.finalClientPhoneSecondary}
                onChange={(e) =>
                  updateFinalClient("finalClientPhoneSecondary", e.target.value)
                }
              />
            </div>
            <Input
              id="fc-email"
              label="Email (opcional)"
              type="email"
              value={finalClient.finalClientEmail}
              onChange={(e) =>
                updateFinalClient("finalClientEmail", e.target.value)
              }
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)} className={btnSecondary}>
              Atrás
            </button>
            <button
              type="button"
              onClick={() => canProceedFromFinalClient() && setStep(4)}
              disabled={!canProceedFromFinalClient()}
              className={btnPrimary}
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
            </p>
            <p className="font-medium text-stone-900 pt-2">Destino</p>
            <p className="text-stone-600">
              {destinationType === "CLIENT_WAREHOUSE"
                ? "Sake Team Food — Málaga (almacén)"
                : `${finalClient.finalClientStreet}, ${finalClient.finalClientPostalCode} ${finalClient.finalClientCity}`}
            </p>
            <p className="font-medium text-stone-900 pt-2">Servicio de envío</p>
            <p className="text-stone-600">
              {selectedShippingService?.label ?? "—"}
              {selectedShippingService &&
                ` · ${formatEuros(selectedShippingService.priceCents)}`}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <OrderFinancialSummary
              lines={estimate.lines}
              shippingCostCents={shipping}
              shippingLabel={
                selectedShippingService
                  ? `${selectedShippingService.label} (estimado)`
                  : "Gastos de envío (estimado)"
              }
              isEstimate
            />
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(3)} className={btnSecondary}>
              Atrás
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className={btnPrimary}
            >
              {loading ? "Enviando..." : "Confirmar pedido"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
