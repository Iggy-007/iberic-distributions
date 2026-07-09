import { formatVariantPrice } from "@/lib/pricing";
import {
  formatCatalogEstimatedPrice,
  type VariantPriceInput,
} from "@/lib/estimated-prices";

export function VariantPriceDisplay({
  variant,
}: {
  variant: VariantPriceInput;
}) {
  const estimated = formatCatalogEstimatedPrice(variant);

  return (
    <div className="text-right text-sm min-w-0 sm:shrink-0 sm:max-w-[55%]">
      <p className="font-medium">{formatVariantPrice(variant)}</p>
      {estimated && (
        <p className="text-xs text-stone-500 mt-0.5 leading-snug">{estimated}</p>
      )}
    </div>
  );
}

export type { VariantPriceInput };
