import type { ReactNode } from "react";
import { formatEuros } from "@/lib/shipping";
import { formatVatPercentLabel } from "@/lib/pricing";
import type { EstimateLineItem } from "@/lib/order-estimates";

function aggregateByVatRate(lines: EstimateLineItem[]) {
  const subtotalByRate = new Map<number, number>();
  const vatByRate = new Map<number, number>();

  for (const line of lines) {
    subtotalByRate.set(
      line.vatRate,
      (subtotalByRate.get(line.vatRate) ?? 0) + line.subtotalCents
    );
    vatByRate.set(
      line.vatRate,
      (vatByRate.get(line.vatRate) ?? 0) + line.vatCents
    );
  }

  const sortedRates = [...subtotalByRate.keys()].sort((a, b) => a - b);

  return { subtotalByRate, vatByRate, sortedRates };
}

export function OrderFinancialSummary({
  lines,
  shippingCostCents,
  shippingLabel = "Gastos de envío",
  isEstimate = false,
  renderLineExtra,
}: {
  lines: EstimateLineItem[];
  shippingCostCents: number;
  shippingLabel?: string;
  isEstimate?: boolean;
  renderLineExtra?: (line: EstimateLineItem) => ReactNode;
}) {
  const subtotalCents = lines.reduce((sum, line) => sum + line.subtotalCents, 0);
  const vatCents = lines.reduce((sum, line) => sum + line.vatCents, 0);
  const subtotalWithVatCents = lines.reduce(
    (sum, line) => sum + line.totalWithVatCents,
    0
  );
  const totalCents = subtotalWithVatCents + shippingCostCents;
  const { subtotalByRate, vatByRate, sortedRates } = aggregateByVatRate(lines);

  return (
    <div className="space-y-4 text-sm">
      <div className="divide-y divide-stone-100">
        {lines.map((line) => (
          <div key={line.key} className="py-3 first:pt-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-900 leading-snug">
                  {line.productName} — {line.variantName}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {line.quantityLabel}
                </p>
                {line.priceFormula && (
                  <p className="text-xs text-stone-500 mt-1">{line.priceFormula}</p>
                )}
                {renderLineExtra?.(line)}
              </div>
              <p className="shrink-0 font-semibold text-stone-900 tabular-nums">
                {formatEuros(line.totalWithVatCents)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Desglose fiscal
        </p>

        {sortedRates.length > 0 ? (
          <div className="relative overflow-x-auto [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[280px] text-xs sm:text-sm">
              <thead>
                <tr className="text-left text-stone-500">
                  <th className="pb-2 font-medium">Tipo IVA</th>
                  <th className="pb-2 font-medium text-right">Base imponible</th>
                  <th className="pb-2 font-medium text-right">Cuota IVA</th>
                </tr>
              </thead>
              <tbody className="text-stone-800">
                {sortedRates.map((rate) => (
                  <tr key={rate}>
                    <td className="py-1 pr-3">{formatVatPercentLabel(rate)}</td>
                    <td className="py-1 text-right tabular-nums">
                      {formatEuros(subtotalByRate.get(rate) ?? 0)}
                    </td>
                    <td className="py-1 text-right tabular-nums">
                      {formatEuros(vatByRate.get(rate) ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-stone-500 text-xs">Sin líneas de producto.</p>
        )}

        <div className="space-y-1.5 border-t border-stone-200 pt-3">
          <div className="flex justify-between text-stone-700">
            <span>Base imponible total</span>
            <span className="tabular-nums">{formatEuros(subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-stone-700">
            <span>IVA total</span>
            <span className="tabular-nums">{formatEuros(vatCents)}</span>
          </div>
          <div className="flex justify-between font-medium text-stone-900">
            <span>Importe productos (IVA incl.)</span>
            <span className="tabular-nums">
              {formatEuros(subtotalWithVatCents)}
            </span>
          </div>
          <div className="flex justify-between text-stone-700">
            <span>{shippingLabel}</span>
            <span className="tabular-nums">{formatEuros(shippingCostCents)}</span>
          </div>
          <div className="flex justify-between border-t border-stone-300 pt-2 text-base font-semibold text-stone-900">
            <span>{isEstimate ? "Total estimado" : "Total pedido"}</span>
            <span className="tabular-nums text-wine">
              {formatEuros(totalCents)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
