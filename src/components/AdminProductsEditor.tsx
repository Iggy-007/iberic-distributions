"use client";

import { useState } from "react";
import { PriceType } from "@prisma/client";
import { ProductDocumentsList, type ProductDocumentItem } from "@/components/ProductDocumentsList";
import { getDocumentLinkLabel } from "@/lib/documents";
import { formatVariantPriceDetail } from "@/lib/pricing";

interface Variant {
  id: string;
  name: string;
  unitLabel: string;
  priceCents: number;
  priceType: PriceType;
  vatRate: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  variants: Variant[];
  documents: ProductDocumentItem[];
}

export function AdminProductsEditor({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(
    initialProducts.map((product) => ({
      ...product,
      variants: product.variants.map((v) => ({
        ...v,
        vatRate: v.vatRate ?? 0.1,
      })),
      documents: product.documents.map((d) => ({
        ...d,
        docType: d.docType ?? "FICHA_TECNICA",
      })),
    }))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState<Record<string, { url: string; docType: string; title: string }>>({});
  const [error, setError] = useState("");

  async function reload() {
    const res = await fetch("/api/products");
    if (!res.ok) {
      setError("No se pudieron cargar los productos");
      return;
    }
    const data: Product[] = await res.json();
    setProducts(
        data.map((product) => ({
          ...product,
          variants: product.variants.map((v) => ({
            ...v,
            vatRate: v.vatRate ?? 0.1,
          })),
          documents: product.documents.map((d) => ({
            ...d,
            docType: d.docType ?? "FICHA_TECNICA",
          })),
        }))
    );
    setError("");
  }

  async function saveProduct(product: Product) {
    setSaving(product.id);
    setError("");
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: product.name,
        description: product.description,
        variants: product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          unitLabel: v.unitLabel,
          priceCents: v.priceCents,
          priceType: v.priceType,
          vatRate: v.vatRate,
        })),
      }),
    });
    setSaving(null);
    if (!res.ok) {
      setError("Error al guardar precios");
      return;
    }
    await reload();
  }

  async function uploadDoc(
    productId: string,
    file: File,
    docType: "FICHA_TECNICA" | "ETIQUETA"
  ) {
    setUploading(productId);
    const form = new FormData();
    form.append("file", file);
    form.append("docType", docType);
    await fetch(`/api/products/${productId}/documents`, {
      method: "POST",
      body: form,
    });
    setUploading(null);
    await reload();
  }

  async function addLink(productId: string) {
    const form = linkForm[productId];
    if (!form?.url.trim()) return;

    setError("");
    const res = await fetch(`/api/products/${productId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileUrl: form.url.trim(),
        docType: form.docType,
        title: form.title.trim() || undefined,
      }),
    });

    if (!res.ok) {
      setError("No se pudo añadir el enlace");
      return;
    }

    setLinkForm((prev) => ({
      ...prev,
      [productId]: { url: "", docType: "FICHA_TECNICA", title: "" },
    }));
    await reload();
  }

  async function removeDoc(productId: string, docId: string) {
    await fetch(`/api/products/${productId}/documents?docId=${docId}`, {
      method: "DELETE",
    });
    await reload();
  }

  function getLinkForm(productId: string) {
    return (
      linkForm[productId] ?? {
        url: "",
        docType: "FICHA_TECNICA",
        title: "",
      }
    );
  }

  function updateVariant(
    productId: string,
    variantId: string,
    priceEuros: string
  ) {
    const cents = Math.round(parseFloat(priceEuros.replace(",", ".")) * 100);
    if (isNaN(cents)) return;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              variants: p.variants.map((v) =>
                v.id === variantId ? { ...v, priceCents: cents } : v
              ),
            }
          : p
      )
    );
  }

  if (products.length === 0) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        No hay productos en la base de datos. Ejecuta{" "}
        <code className="font-mono">npm run db:seed</code> para restaurar el
        catálogo.
      </p>
    );
  }

  return (
    <>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {products.map((product) => (
        <div
          key={product.id}
          className="rounded-xl border border-stone-200 bg-white p-5 space-y-4"
        >
          <div>
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <p className="text-sm text-stone-500">{product.description}</p>
          </div>

          <div className="space-y-3">
            {product.variants.map((v) => (
              <div
                key={v.id}
                className="flex flex-wrap items-center gap-3 text-sm border-b border-stone-100 pb-3"
              >
                <span className="w-48 font-medium">{v.name}</span>
                {v.priceType === "PER_KG" ? (
                  <span className="text-stone-500">Base €/kg (sin IVA)</span>
                ) : (
                  <span className="text-stone-500">
                    Base /{v.unitLabel} (sin IVA)
                  </span>
                )}
                <input
                  type="number"
                  step="0.01"
                  defaultValue={(v.priceCents / 100).toFixed(2)}
                  onChange={(e) =>
                    updateVariant(product.id, v.id, e.target.value)
                  }
                  className="w-24 rounded border border-stone-300 px-2 py-1"
                />
                <span>{v.priceType === "PER_KG" ? "€/kg" : "€"}</span>
                <span className="text-stone-600 font-medium">
                  → {formatVariantPriceDetail(v)}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => saveProduct(product)}
            disabled={saving === product.id}
            className="rounded-lg bg-wine px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {saving === product.id ? "Guardando..." : "Guardar precios"}
          </button>

          <div className="border-t pt-4 space-y-4">
            <ProductDocumentsList documents={product.documents} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-2">Subir PDF</p>
                <select
                  id={`upload-type-${product.id}`}
                  className="mb-2 w-full rounded border border-stone-300 px-2 py-1 text-sm"
                  defaultValue="FICHA_TECNICA"
                >
                  <option value="FICHA_TECNICA">Ficha técnica</option>
                  <option value="ETIQUETA">Etiqueta</option>
                </select>
                <label className="inline-block cursor-pointer rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50">
                  {uploading === product.id ? "Subiendo..." : "Elegir archivo PDF"}
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      const select = document.getElementById(
                        `upload-type-${product.id}`
                      ) as HTMLSelectElement;
                      if (f) {
                        uploadDoc(
                          product.id,
                          f,
                          (select?.value ?? "FICHA_TECNICA") as
                            | "FICHA_TECNICA"
                            | "ETIQUETA"
                        );
                      }
                    }}
                  />
                </label>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Añadir enlace</p>
                <div className="space-y-2">
                  <select
                    value={getLinkForm(product.id).docType}
                    onChange={(e) =>
                      setLinkForm((prev) => ({
                        ...prev,
                        [product.id]: {
                          ...getLinkForm(product.id),
                          docType: e.target.value,
                        },
                      }))
                    }
                    className="w-full rounded border border-stone-300 px-2 py-1 text-sm"
                  >
                    <option value="FICHA_TECNICA">Ficha técnica</option>
                    <option value="ETIQUETA">Etiqueta</option>
                  </select>
                  <input
                    placeholder="https://... o /uploads/docs/archivo.pdf"
                    value={getLinkForm(product.id).url}
                    onChange={(e) =>
                      setLinkForm((prev) => ({
                        ...prev,
                        [product.id]: {
                          ...getLinkForm(product.id),
                          url: e.target.value,
                        },
                      }))
                    }
                    className="w-full rounded border border-stone-300 px-2 py-1 text-sm"
                  />
                  <input
                    placeholder="Título opcional"
                    value={getLinkForm(product.id).title}
                    onChange={(e) =>
                      setLinkForm((prev) => ({
                        ...prev,
                        [product.id]: {
                          ...getLinkForm(product.id),
                          title: e.target.value,
                        },
                      }))
                    }
                    className="w-full rounded border border-stone-300 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => addLink(product.id)}
                    className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
                  >
                    Añadir enlace
                  </button>
                </div>
              </div>
            </div>

            {product.documents.length > 0 && (
              <ul className="text-xs text-stone-500 space-y-1">
                {product.documents.map((d) => (
                  <li key={d.id} className="flex justify-between gap-2">
                    <span>{getDocumentLinkLabel(d.docType, d.title)}</span>
                    <button
                      type="button"
                      onClick={() => removeDoc(product.id, d.id)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
