"use client";

import { PriceType } from "@prisma/client";
import type { ProductOfferingsState } from "@/lib/product-presentations";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm";

export function ProductOfferingsFields({
  offerings,
  onChange,
  idPrefix = "offerings",
}: {
  offerings: ProductOfferingsState;
  onChange: (next: ProductOfferingsState) => void;
  idPrefix?: string;
}) {
  function updateBase(patch: Partial<ProductOfferingsState["base"]>) {
    onChange({ ...offerings, base: { ...offerings.base, ...patch } });
  }

  function updateService(
    key: "loncheado" | "plateado",
    patch: Partial<ProductOfferingsState["loncheado"]>
  ) {
    onChange({ ...offerings, [key]: { ...offerings[key], ...patch } });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-stone-200 bg-stone-50/80 p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Producto base</h3>
          <p className="text-xs text-stone-500 mt-1">
            Presentación entera. Precio por kg sin IVA.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-stone-700">Precio base (€/kg)</span>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={offerings.base.priceEuros}
              onChange={(e) => updateBase({ priceEuros: e.target.value })}
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-stone-700">IVA (%)</span>
            <input
              required
              type="number"
              step="1"
              min="0"
              max="100"
              value={offerings.base.vatPercent}
              onChange={(e) => updateBase({ vatPercent: e.target.value })}
              className={`${inputClass} mt-1`}
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">
            Servicios opcionales
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Active los servicios que se pueden combinar con este producto.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-3">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={offerings.loncheado.enabled}
                onChange={(e) =>
                  updateService("loncheado", { enabled: e.target.checked })
                }
                className="mt-1"
              />
              <span>
                <span className="font-medium text-stone-900">
                  Loncheado (sobres)
                </span>
                <span className="block text-xs text-stone-500 mt-0.5">
                  Corte en paquetes. Precio por paquete sin IVA.
                </span>
              </span>
            </label>
            {offerings.loncheado.enabled && (
              <div className="grid gap-3 sm:grid-cols-2 pl-7">
                <label className="block text-sm sm:col-span-2">
                  <span className="font-medium text-stone-700">
                    Ref. Pdto Galvan (loncheado)
                  </span>
                  <input
                    required
                    type="text"
                    value={offerings.loncheado.galvanReference}
                    onChange={(e) =>
                      updateService("loncheado", {
                        galvanReference: e.target.value,
                      })
                    }
                    placeholder="Ej. GAL-JAM-75-LON"
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-stone-700">
                    Precio (€/paquete)
                  </span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={offerings.loncheado.priceEuros}
                    onChange={(e) =>
                      updateService("loncheado", { priceEuros: e.target.value })
                    }
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-stone-700">IVA (%)</span>
                  <input
                    required
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={offerings.loncheado.vatPercent}
                    onChange={(e) =>
                      updateService("loncheado", { vatPercent: e.target.value })
                    }
                    className={`${inputClass} mt-1`}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-3">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={offerings.plateado.enabled}
                onChange={(e) =>
                  updateService("plateado", { enabled: e.target.checked })
                }
                className="mt-1"
              />
              <span>
                <span className="font-medium text-stone-900">Plateado</span>
                <span className="block text-xs text-stone-500 mt-0.5">
                  Presentación en platos. Precio por plato sin IVA.
                </span>
              </span>
            </label>
            {offerings.plateado.enabled && (
              <div className="grid gap-3 sm:grid-cols-2 pl-7">
                <label className="block text-sm sm:col-span-2">
                  <span className="font-medium text-stone-700">
                    Ref. Pdto Galvan (plateado)
                  </span>
                  <input
                    required
                    type="text"
                    value={offerings.plateado.galvanReference}
                    onChange={(e) =>
                      updateService("plateado", {
                        galvanReference: e.target.value,
                      })
                    }
                    placeholder="Ej. GAL-JAM-75-PLA"
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-stone-700">
                    Precio (€/plato)
                  </span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={offerings.plateado.priceEuros}
                    onChange={(e) =>
                      updateService("plateado", { priceEuros: e.target.value })
                    }
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-stone-700">IVA (%)</span>
                  <input
                    required
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={offerings.plateado.vatPercent}
                    onChange={(e) =>
                      updateService("plateado", { vatPercent: e.target.value })
                    }
                    className={`${inputClass} mt-1`}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
