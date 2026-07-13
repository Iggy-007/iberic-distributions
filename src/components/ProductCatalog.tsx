import { ProductCatalogClient } from "@/components/ProductCatalogClient";
import type { ShippingService } from "@/lib/shipping-rates";
import type { ProductDocumentItem } from "@/components/ProductDocumentsList";
import { PriceType, VariantPresentation } from "@prisma/client";

interface Product {
  id: string;
  name: string;
  galvanReference: string;
  description: string | null;
  variants: {
    id: string;
    name: string;
    presentation: VariantPresentation;
    galvanReference: string;
    unitLabel: string;
    priceCents: number;
    priceType: PriceType;
    vatRate: number;
  }[];
  documents: ProductDocumentItem[];
}

export function ProductCatalog({
  products,
  shippingServices,
  showOrderCta = false,
}: {
  products: Product[];
  shippingServices?: ShippingService[];
  showOrderCta?: boolean;
}) {
  return (
    <ProductCatalogClient
      products={products}
      shippingServices={shippingServices}
      showOrderCta={showOrderCta}
    />
  );
}
