"use client";

import { useState } from "react";
import { ProductCatalog } from "@/components/ProductCatalog";
import { CatalogProductsEditor } from "@/components/CatalogProductsEditor";
import { CatalogNotificationsList } from "@/components/CatalogNotificationsList";
import { ShippingRatesEditor } from "@/components/ShippingRatesEditor";
import type { ShippingRates } from "@/lib/shipping-rates";
import type { CatalogProduct } from "@/components/CatalogProductsEditor";

interface CatalogTabsProps {
  products: CatalogProduct[];
  shippingRates: ShippingRates;
  mode: "admin" | "provider";
}

export function CatalogTabs({ products, shippingRates, mode }: CatalogTabsProps) {
  const [tab, setTab] = useState<"view" | "manage">("view");
  const isAdmin = mode === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("view")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === "view"
              ? "bg-wine text-white"
              : "border border-stone-300 text-stone-700 hover:bg-stone-50"
          }`}
        >
          Ver catálogo
        </button>
        <button
          type="button"
          onClick={() => setTab("manage")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === "manage"
              ? "bg-wine text-white"
              : "border border-stone-300 text-stone-700 hover:bg-stone-50"
          }`}
        >
          Gestionar productos y servicios
        </button>
      </div>

      {tab === "view" ? (
        <ProductCatalog products={products} shippingRates={shippingRates} />
      ) : (
        <div className="space-y-6">
          {isAdmin ? (
            <>
              <p className="text-sm text-stone-500">
                Gestione los productos con sus servicios combinables (loncheado y
                plateado) y el servicio de envío del pedido.
              </p>
              <CatalogNotificationsList />
            </>
          ) : (
            <p className="text-sm text-stone-500">
              Puede editar productos, servicios combinables y el servicio de
              envío igual que en administración. El administrador recibirá un
              aviso de cada cambio.
            </p>
          )}

          <ShippingRatesEditor initialRates={shippingRates} />

          <CatalogProductsEditor
            initialProducts={products}
            title={isAdmin ? "Productos del catálogo" : "Productos del catálogo Galvan"}
          />
        </div>
      )}
    </div>
  );
}
