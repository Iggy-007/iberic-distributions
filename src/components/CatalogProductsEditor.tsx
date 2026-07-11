"use client";

import { useMemo, useState } from "react";
import { PriceType, VariantPresentation } from "@prisma/client";
import {
  ProductDocumentsList,
  type ProductDocumentItem,
} from "@/components/ProductDocumentsList";
import { ProductOfferingsFields } from "@/components/ProductOfferingsFields";
import { getDocumentLinkLabel } from "@/lib/documents";
import {
  DEFAULT_CREATE_OFFERINGS,
  type ProductOfferingsState,
  offeringsStateToPayload,
  sortVariantsByPresentation,
  variantsToOfferingsState,
} from "@/lib/product-presentations";

interface Variant {
  id: string;
  name: string;
  presentation: VariantPresentation;
  galvanReference: string;
  unitLabel: string;
  priceCents: number;
  priceType: PriceType;
  vatRate: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  galvanReference: string;
  description: string | null;
  variants: Variant[];
  documents: ProductDocumentItem[];
}

function normalizeProducts(products: CatalogProduct[]): CatalogProduct[] {
  return products.map((product) => ({
    ...product,
    galvanReference: product.galvanReference ?? "",
    variants: sortVariantsByPresentation(
      product.variants.map((variant) => ({
        ...variant,
        presentation: variant.presentation ?? VariantPresentation.BASE,
        galvanReference: variant.galvanReference ?? "",
        vatRate: variant.vatRate ?? 0.1,
      }))
    ),
    documents: product.documents.map((doc) => ({
      ...doc,
      docType: doc.docType ?? "FICHA_TECNICA",
    })),
  }));
}

export function CatalogProductsEditor({
  initialProducts,
  title = "Catálogo de productos",
  emptyMessage = "No hay productos en el catálogo. Cree el primero con el botón «Nuevo producto».",
}: {
  initialProducts: CatalogProduct[];
  title?: string;
  emptyMessage?: string;
}) {
  const [products, setProducts] = useState<CatalogProduct[]>(
    normalizeProducts(initialProducts)
  );
  const [offeringsByProduct, setOfferingsByProduct] = useState<
    Record<string, ProductOfferingsState>
  >(() =>
    Object.fromEntries(
      normalizeProducts(initialProducts).map((product) => [
        product.id,
        variantsToOfferingsState(product.variants),
      ])
    )
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState<
    Record<string, { url: string; docType: string; title: string }>
  >({});
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    galvanReference: "",
    description: "",
    offerings: DEFAULT_CREATE_OFFERINGS,
  });

  const hasProducts = products.length > 0 || showCreate;

  async function reload() {
    const res = await fetch("/api/products");
    if (!res.ok) {
      setError("No se pudieron cargar los productos");
      return;
    }
    const data: CatalogProduct[] = await res.json();
    const normalized = normalizeProducts(data);
    setProducts(normalized);
    setOfferingsByProduct(
      Object.fromEntries(
        normalized.map((product) => [
          product.id,
          variantsToOfferingsState(product.variants),
        ])
      )
    );
    setError("");
  }

  async function saveProduct(product: CatalogProduct) {
    const offerings = offeringsByProduct[product.id];
    const payload = offerings ? offeringsStateToPayload(offerings) : null;
    if (!payload) {
      setError("Revise precios, IVA y referencias Galvan de los servicios activos");
      return;
    }

    setSaving(product.id);
    setError("");
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: product.name,
        galvanReference: product.galvanReference,
        description: product.description,
        offerings: payload,
      }),
    });
    setSaving(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al guardar el producto");
      return;
    }
    await reload();
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    const payload = offeringsStateToPayload(createForm.offerings);
    if (!payload) {
      setError("Indique el precio base, referencias Galvan de servicios activos y precios");
      return;
    }

    setCreating(true);
    setError("");

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createForm.name,
        galvanReference: createForm.galvanReference,
        description: createForm.description,
        offerings: payload,
      }),
    });

    setCreating(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo crear el producto");
      return;
    }

    setCreateForm({
      name: "",
      galvanReference: "",
      description: "",
      offerings: DEFAULT_CREATE_OFFERINGS,
    });
    setShowCreate(false);
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
    const res = await fetch(`/api/products/${productId}/documents`, {
      method: "POST",
      body: form,
    });
    setUploading(null);
    if (!res.ok) {
      setError("No se pudo subir el documento");
      return;
    }
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
    const res = await fetch(
      `/api/products/${productId}/documents?docId=${docId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      setError("No se pudo eliminar el documento");
      return;
    }
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

  const createSummary = useMemo(() => {
    const services = [
      createForm.offerings.loncheado.enabled ? "loncheado" : null,
      createForm.offerings.plateado.enabled ? "plateado" : null,
    ].filter(Boolean);
    return services.length > 0
      ? `Se combinará con: ${services.join(" y ")}`
      : "Solo producto entero (sin servicios adicionales)";
  }, [createForm.offerings]);

  if (!hasProducts) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white"
          >
            Nuevo producto
          </button>
        </div>
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-50"
        >
          {showCreate ? "Cancelar" : "Nuevo producto"}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={createProduct}
          className="rounded-xl border border-stone-200 bg-white p-5 space-y-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Nombre del producto"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              className="rounded-lg border border-stone-300 px-3 py-2 sm:col-span-2"
            />
            <input
              required
              placeholder="Referencia de Pdto Galvan"
              value={createForm.galvanReference}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  galvanReference: e.target.value,
                })
              }
              className="rounded-lg border border-stone-300 px-3 py-2 sm:col-span-2"
            />
            <textarea
              placeholder="Descripción (opcional)"
              value={createForm.description}
              onChange={(e) =>
                setCreateForm({ ...createForm, description: e.target.value })
              }
              className="rounded-lg border border-stone-300 px-3 py-2 sm:col-span-2 min-h-[80px]"
            />
          </div>

          <ProductOfferingsFields
            offerings={createForm.offerings}
            onChange={(offerings) =>
              setCreateForm({ ...createForm, offerings })
            }
            idPrefix="create"
          />

          <p className="text-xs text-stone-500">{createSummary}</p>

          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-wine px-4 py-2 text-white disabled:opacity-60"
          >
            {creating ? "Creando..." : "Crear producto"}
          </button>
        </form>
      )}

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
          <div className="space-y-2">
            <input
              value={product.name}
              onChange={(e) =>
                setProducts((prev) =>
                  prev.map((p) =>
                    p.id === product.id ? { ...p, name: e.target.value } : p
                  )
                )
              }
              className="text-lg font-semibold w-full rounded-lg border border-transparent px-1 py-0.5 hover:border-stone-200 focus:border-wine focus:outline-none"
            />
            <label className="block text-sm">
              <span className="font-medium text-stone-700">
                Referencia de Pdto Galvan
              </span>
              <input
                required
                value={product.galvanReference}
                onChange={(e) =>
                  setProducts((prev) =>
                    prev.map((p) =>
                      p.id === product.id
                        ? { ...p, galvanReference: e.target.value }
                        : p
                    )
                  )
                }
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </label>
            <textarea
              value={product.description ?? ""}
              onChange={(e) =>
                setProducts((prev) =>
                  prev.map((p) =>
                    p.id === product.id
                      ? { ...p, description: e.target.value }
                      : p
                  )
                )
              }
              placeholder="Descripción"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-600 min-h-[60px]"
            />
          </div>

          <ProductOfferingsFields
            offerings={
              offeringsByProduct[product.id] ??
              variantsToOfferingsState(product.variants)
            }
            onChange={(offerings) =>
              setOfferingsByProduct((prev) => ({
                ...prev,
                [product.id]: offerings,
              }))
            }
            idPrefix={product.id}
          />

          <button
            type="button"
            onClick={() => saveProduct(product)}
            disabled={saving === product.id}
            className="rounded-lg bg-wine px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {saving === product.id ? "Guardando..." : "Guardar producto"}
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
                  {uploading === product.id
                    ? "Subiendo..."
                    : "Elegir archivo PDF"}
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      const select = document.getElementById(
                        `upload-type-${product.id}`
                      ) as HTMLSelectElement;
                      if (file) {
                        uploadDoc(
                          product.id,
                          file,
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
                {product.documents.map((doc) => (
                  <li key={doc.id} className="flex justify-between gap-2">
                    <span>{getDocumentLinkLabel(doc.docType, doc.title)}</span>
                    <button
                      type="button"
                      onClick={() => removeDoc(product.id, doc.id)}
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
    </div>
  );
}
