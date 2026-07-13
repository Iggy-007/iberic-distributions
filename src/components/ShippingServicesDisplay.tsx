import { ShippingType } from "@prisma/client";
import { formatEuros, shippingTypeLabel } from "@/lib/shipping";
import type { ShippingService } from "@/lib/shipping-rates";

export function ShippingServicesDisplay({
  services,
}: {
  services: ShippingService[];
}) {
  const active = services.filter((s) => s.active);
  const grouped = {
    [ShippingType.NATIONAL]: active.filter((s) => s.type === ShippingType.NATIONAL),
    [ShippingType.INTERNATIONAL]: active.filter(
      (s) => s.type === ShippingType.INTERNATIONAL
    ),
  };

  return (
    <div className="space-y-4">
      {([ShippingType.NATIONAL, ShippingType.INTERNATIONAL] as const).map(
        (type) => (
          <div key={type} className="space-y-2">
            <h3 className="text-sm font-semibold text-stone-800">
              {shippingTypeLabel(type)}
            </h3>
            {grouped[type].length === 0 ? (
              <p className="text-sm text-stone-500">Sin servicios activos.</p>
            ) : (
              <ul className="space-y-2">
                {grouped[type].map((service) => (
                  <li
                    key={service.id}
                    className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium text-stone-900">
                        {service.label}
                        {service.isDefault && (
                          <span className="ml-2 text-xs font-normal text-stone-500">
                            (predeterminado)
                          </span>
                        )}
                      </span>
                      <span className="text-lg font-semibold text-stone-900 tabular-nums">
                        {formatEuros(service.priceCents)}
                      </span>
                    </div>
                    {service.supplier.trim() && (
                      <p className="mt-1 text-stone-600">
                        Proveedor: {service.supplier.trim()}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      )}
    </div>
  );
}
