"use client";

import { useState } from "react";
import type { CatalogDocumentType } from "@/lib/documents";
import {
  CATALOG_DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_UPLOAD_ACCEPT,
  DOCUMENT_UPLOAD_HINT,
  isAllowedDocumentFile,
} from "@/lib/documents";
import {
  ProductDocumentsList,
  type ProductDocumentItem,
} from "@/components/ProductDocumentsList";

type LinkFormState = { url: string; title: string };

const emptyLinkForm = (): LinkFormState => ({ url: "", title: "" });

export function ProductDocumentsEditor({
  productId,
  documents,
  uploading,
  onUpload,
  onAddLink,
  onRemove,
  onError,
}: {
  productId: string;
  documents: ProductDocumentItem[];
  uploading: boolean;
  onUpload: (
    productId: string,
    file: File,
    docType: CatalogDocumentType
  ) => Promise<void>;
  onAddLink: (
    productId: string,
    docType: CatalogDocumentType,
    url: string,
    title: string
  ) => Promise<void>;
  onRemove: (productId: string, docId: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [linkForms, setLinkForms] = useState<
    Record<CatalogDocumentType, LinkFormState>
  >({
    FICHA_TECNICA: emptyLinkForm(),
    FOLLETO_INFORMATIVO: emptyLinkForm(),
  });

  function updateLinkForm(
    docType: CatalogDocumentType,
    patch: Partial<LinkFormState>
  ) {
    setLinkForms((prev) => ({
      ...prev,
      [docType]: { ...prev[docType], ...patch },
    }));
  }

  return (
    <div className="border-t border-stone-200 pt-4 space-y-5">
      <ProductDocumentsList
        documents={documents}
        editable
        onRemove={(docId) => onRemove(productId, docId)}
      />

      {CATALOG_DOCUMENT_TYPES.map((docType) => {
        const form = linkForms[docType];
        const inputId = `upload-${productId}-${docType}`;

        return (
          <div
            key={docType}
            className="rounded-lg border border-stone-200 bg-stone-50/60 p-4 space-y-3"
          >
            <p className="text-sm font-medium text-stone-800">
              {DOCUMENT_TYPE_LABELS[docType]}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor={inputId}
                className="inline-flex cursor-pointer items-center rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-50"
              >
                {uploading
                  ? "Subiendo..."
                  : `Subir archivo (${DOCUMENT_UPLOAD_HINT[docType]})`}
              </label>
              <input
                id={inputId}
                type="file"
                accept={DOCUMENT_UPLOAD_ACCEPT[docType]}
                className="sr-only"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  if (!isAllowedDocumentFile(file, docType)) {
                    onError(
                      docType === "FICHA_TECNICA"
                        ? "Solo se permiten archivos PDF, JPG o PNG"
                        : "Solo se permiten archivos PDF"
                    );
                    return;
                  }
                  await onUpload(productId, file, docType);
                }}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-stone-600">
                O añadir enlace ({DOCUMENT_TYPE_LABELS[docType]})
              </p>
              <input
                placeholder="https://... o /uploads/docs/archivo"
                value={form.url}
                onChange={(e) => updateLinkForm(docType, { url: e.target.value })}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
              />
              <input
                placeholder="Título opcional"
                value={form.title}
                onChange={(e) =>
                  updateLinkForm(docType, { title: e.target.value })
                }
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={!form.url.trim()}
                onClick={async () => {
                  await onAddLink(
                    productId,
                    docType,
                    form.url.trim(),
                    form.title.trim()
                  );
                  updateLinkForm(docType, emptyLinkForm());
                }}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-50 disabled:opacity-50"
              >
                Añadir enlace
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
