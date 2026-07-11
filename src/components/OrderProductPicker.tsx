"use client";

import { useMemo } from "react";
import { PriceType, VariantPresentation } from "@prisma/client";
import { formatVariantPrice } from "@/lib/pricing";
import {
  getVariantKind,
  getVariantOrderHint,
} from "@/lib/order-estimates";
import { formatEstimatedPriceForUnits } from "@/lib/estimated-prices";
import {
  formatVariantDisplayName,
  isServicePresentation,
  resolveVariantGalvanReference,
  sortVariantsByPresentation,
} from "@/lib/product-presentations";
import { ProductGalvanReference } from "@/components/ProductGalvanReference";

export interface OrderVariant {
  id: string;
  name: string;
  presentation?: VariantPresentation;
  galvanReference?: string;
  unitLabel: string;
  priceCents: number;
  priceType: PriceType;
  vatRate: number;
  product: { id: string; name: string; galvanReference: string };
}

interface ProductGroup {
  product: OrderVariant["product"];
  base?: OrderVariant;
  services: OrderVariant[];
}

function groupVariants(variants: OrderVariant[]): ProductGroup[] {
  const byProduct = new Map<string, ProductGroup>();

  for (const variant of variants) {
    const group = byProduct.get(variant.product.id) ?? {
      product: variant.product,
      services: [],
    };

    if (isServicePresentation(variant.presentation ?? VariantPresentation.BASE)) {
      group.services.push(variant);
    } else {
      group.base = variant;
    }

    byProduct.set(variant.product.id, group);
  }

  return [...byProduct.values()].map((group) => ({
    ...group,
    services: sortVariantsByPresentation(group.services),
  }));
}

function VariantQuantityRow({
  variant,
  productReference,
  quantity,
  onQuantityChange,
  compact = false,
}: {
  variant: OrderVariant;
  productReference: string;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  compact?: boolean;
}) {
  const presentation = variant.presentation ?? VariantPresentation.BASE;
  const isService = isServicePresentation(presentation);
  const label = formatVariantDisplayName({
    name: variant.name,
    presentation,
  });
  const galvanRef = resolveVariantGalvanReference(
    { presentation, galvanReference: variant.galvanReference ?? "" },
    productReference
  );
  const hint = getVariantOrderHint(
    getVariantKind(variant.name, variant.product.name, presentation)
  );
  const priceFormula =
    quantity > 0
      ? formatEstimatedPriceForUnits(
          { ...variant, productName: variant.product.name },
          quantity
        )
      : null;

  return (
    <div
      className={`flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between ${
        compact ? "py-2" : "py-3"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p
          className={`font-medium ${
            isService ? "text-stone-800" : "text-stone-900"
          }`}
        >
          {label}
        </p>
        {(isService || galvanRef) && (
          <ProductGalvanReference reference={galvanRef} compact />
        )}
        <p className="text-sm text-stone-500 mt-0.5">
          {formatVariantPrice(variant)}
        </p>
        {hint && <p className="text-xs text-stone-400 mt-1">{hint}</p>}
        {priceFormula && (
          <p className="text-xs font-medium text-stone-600 mt-1">
            {priceFormula}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 sm:pt-0.5">
        <span className="text-xs text-stone-500">unid.</span>
        <input
          type="number"
          min={0}
          step={1}
          value={quantity || ""}
          onChange={(e) =>
            onQuantityChange(parseInt(e.target.value, 10) || 0)
          }
          className="w-20 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-center"
          placeholder="0"
          aria-label={`Cantidad ${label}`}
        />
      </div>
    </div>
  );
}

export function OrderProductPicker({
  variants,
  getQty,
  setQty,
}: {
  variants: OrderVariant[];
  getQty: (variantId: string) => number;
  setQty: (variantId: string, quantity: number) => void;
}) {
  const groups = useMemo(() => groupVariants(variants), [variants]);

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const groupVariantIds = [
          group.base?.id,
          ...group.services.map((service) => service.id),
        ].filter(Boolean) as string[];
        const selectedInGroup = groupVariantIds.reduce(
          (sum, id) => sum + getQty(id),
          0
        );

        return (
          <article
            key={group.product.id}
            className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm"
          >
            <header className="border-b border-stone-100 bg-stone-50/80 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-wine">
                    {group.product.name}
                  </h3>
                  <ProductGalvanReference
                    reference={group.product.galvanReference}
                    compact
                  />
                </div>
                {selectedInGroup > 0 && (
                  <span className="rounded-full bg-wine/10 px-2.5 py-0.5 text-xs font-medium text-wine">
                    {selectedInGroup} en pedido
                  </span>
                )}
              </div>
            </header>

            <div className="px-4 sm:px-5">
              {group.base && (
                <div className="border-b border-stone-100">
                  <p className="pt-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Producto
                  </p>
                  <VariantQuantityRow
                    variant={group.base}
                    productReference={group.product.galvanReference}
                    quantity={getQty(group.base.id)}
                    onQuantityChange={(qty) => setQty(group.base!.id, qty)}
                  />
                </div>
              )}

              {group.services.length > 0 && (
                <div className="pb-2">
                  <p className="pt-3 text-xs font-semibold uppercase tracking-wide text-amber-800/80">
                    Servicios combinables
                  </p>
                  <div className="mt-1 rounded-lg border border-amber-100 bg-amber-50/50 divide-y divide-amber-100/80 px-3">
                    {group.services.map((service) => (
                      <VariantQuantityRow
                        key={service.id}
                        variant={service}
                        productReference={group.product.galvanReference}
                        quantity={getQty(service.id)}
                        onQuantityChange={(qty) => setQty(service.id, qty)}
                        compact
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
