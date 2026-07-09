import { PriceType } from "@prisma/client";
import {
  ProductDocumentsList,
  type ProductDocumentItem,
} from "@/components/ProductDocumentsList";
import { VariantPriceDisplay } from "@/components/VariantPriceDisplay";

interface Product {
  id: string;
  name: string;
  description: string | null;
  variants: {
    id: string;
    name: string;
    unitLabel: string;
    priceCents: number;
    priceType: PriceType;
    vatRate: number;
  }[];
  documents: ProductDocumentItem[];
}

export function ProductCatalog({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {products.map((product) => (
        <article
          key={product.id}
          className="rounded-xl border border-stone-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-wine">{product.name}</h2>
          {product.description && (
            <p className="text-sm text-stone-600 mt-2">{product.description}</p>
          )}
          <ul className="mt-4 space-y-2">
            {product.variants.map((v) => (
              <li
                key={v.id}
                className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4 text-sm border-b border-stone-100 pb-3"
              >
                <span className="font-medium text-stone-800">{v.name}</span>
                <VariantPriceDisplay variant={v} />
              </li>
            ))}
          </ul>
          <ProductDocumentsList documents={product.documents} />
        </article>
      ))}
    </div>
  );
}
