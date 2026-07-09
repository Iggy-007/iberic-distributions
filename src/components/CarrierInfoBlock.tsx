import type { CarrierInfo } from "@/lib/carrier";

export function CarrierInfoBlock({
  carrier,
  compact = false,
}: {
  carrier: CarrierInfo;
  compact?: boolean;
}) {
  if (
    !carrier.carrierCompany &&
    !carrier.carrierTrackingNumber &&
    !carrier.carrierPhone
  ) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border border-stone-200 bg-stone-50 ${
        compact ? "p-3 text-sm" : "p-4"
      }`}
    >
      <h3 className={`font-semibold text-stone-900 ${compact ? "text-sm" : ""}`}>
        Transportista
      </h3>
      <dl className={`mt-2 space-y-1 ${compact ? "text-xs" : "text-sm"} text-stone-600`}>
        {carrier.carrierCompany && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-stone-500">Empresa:</dt>
            <dd className="font-medium text-stone-800">{carrier.carrierCompany}</dd>
          </div>
        )}
        {carrier.carrierTrackingNumber && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-stone-500">Nº seguimiento:</dt>
            <dd className="font-medium text-stone-800 break-all">
              {carrier.carrierTrackingNumber}
            </dd>
          </div>
        )}
        {carrier.carrierPhone && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-stone-500">Teléfono:</dt>
            <dd className="font-medium text-stone-800">{carrier.carrierPhone}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
