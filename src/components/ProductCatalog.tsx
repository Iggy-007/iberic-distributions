import { PriceType, VariantPresentation } from "@prisma/client";
import {
  ProductDocumentsList,
  type ProductDocumentItem,
} from "@/components/ProductDocumentsList";
import { VariantPriceDisplay } from "@/components/VariantPriceDisplay";
import { ProductGalvanReference } from "@/components/ProductGalvanReference";
import { ShippingRatesDisplay } from "@/components/ShippingRatesDisplay";
import {
  formatVariantDisplayName,
  isServicePresentation,
  resolveVariantGalvanReference,
  sortVariantsByPresentation,
} from "@/lib/product-presentations";

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
  shippingRates,
}: {
  products: Product[];
  shippingRates?: import("@/lib/shipping-rates").ShippingRates;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {products.map((product) => {
          const variants = sortVariantsByPresentation(product.variants);
          const baseVariants = variants.filter(
            (variant) => !isServicePresentation(variant.presentation)
          );
          const serviceVariants = variants.filter((variant) =>
            isServicePresentation(variant.presentation)
          );

          return (
            <article
              key={product.id}
              className="rounded-xl border border-stone-200 bg-white p-5"
            >
              <h2 className="text-lg font-semibold text-wine">{product.name}</h2>
              <ProductGalvanReference reference={product.galvanReference} />
              {product.description && (
                <p className="text-sm text-stone-600 mt-2">
                  {product.description}
                </p>
              )}

              <div className="mt-4 space-y-4">
                <ul className="space-y-2">
                  {baseVariants.map((variant) => (
                    <li
                      key={variant.id}
                      className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4 text-sm border-b border-stone-100 pb-3"
                    >
                      <span className="font-medium text-stone-800">
                        {formatVariantDisplayName(variant)}
                      </span>
                      <VariantPriceDisplay variant={variant} />
                    </li>
                  ))}
                </ul>

                {serviceVariants.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
                      Servicios combinables
                    </p>
                    <ul className="space-y-2">
                      {serviceVariants.map((variant) => (
                        <li
                          key={variant.id}
                          className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4 text-sm rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2"
                        >
                          <div>
                            <span className="font-medium text-stone-800">
                              {formatVariantDisplayName(variant)}
                            </span>
                            <ProductGalvanReference
                              reference={resolveVariantGalvanReference(
                                variant,
                                product.galvanReference
                              )}
                              compact
                            />
                          </div>
                          <VariantPriceDisplay variant={variant} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <ProductDocumentsList documents={product.documents} />
            </article>
          );
        })}
      </div>

      {shippingRates && (
        <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
            Servicio del pedido
          </p>
          <h2 className="text-lg font-semibold text-stone-900 mt-1">
            Servicio de envío
          </h2>
          <p className="mt-1 text-sm text-stone-600 mb-4">
            Aplicado al pedido completo según país de destino.
          </p>
          <ShippingRatesDisplay rates={shippingRates} />
        </section>
      )}
    </div>
  );
}
