import { formatEuros } from "@/lib/shipping";
import type { ShippingRates } from "@/lib/shipping-rates";

export function ShippingRatesDisplay({ rates }: { rates: ShippingRates }) {
  return (
    <div className="space-y-3">
      {rates.supplier?.trim() && (
        <p className="text-sm text-stone-600">
          <span className="font-medium text-stone-700">Proveedor del servicio:</span>{" "}
          {rates.supplier.trim()}
        </p>
      )}
      <dl className="grid gap-3 sm:grid-cols-2 text-sm">
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
          <dt className="text-stone-500">Nacional (España)</dt>
          <dd className="mt-1 text-lg font-semibold text-stone-900">
            {formatEuros(rates.nationalCents)}
          </dd>
        </div>
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
          <dt className="text-stone-500">Internacional</dt>
          <dd className="mt-1 text-lg font-semibold text-stone-900">
            {formatEuros(rates.internationalCents)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
