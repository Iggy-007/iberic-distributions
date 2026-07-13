import type { DocumentType } from "@prisma/client";
import {
  CATALOG_DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  documentsForCatalogType,
  getDocumentLinkLabel,
  isExternalUrl,
  isImageDocumentUrl,
  type CatalogDocumentType,
} from "@/lib/documents";

export interface ProductDocumentItem {
  id: string;
  docType: DocumentType;
  title: string | null;
  fileUrl: string;
}

export function ProductDocumentsList({
  documents,
  editable = false,
  onRemove,
}: {
  documents: ProductDocumentItem[];
  editable?: boolean;
  onRemove?: (docId: string) => void;
}) {
  const grouped = CATALOG_DOCUMENT_TYPES.map((type) => ({
    type,
    items: documentsForCatalogType(documents, type) as ProductDocumentItem[],
  })).filter((group) => group.items.length > 0);

  if (grouped.length === 0 && !editable) return null;

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-stone-900">Documentación</p>
      {grouped.length === 0 ? (
        <p className="text-sm text-stone-500">Sin documentos adjuntos.</p>
      ) : (
        grouped.map((group) => (
          <div key={group.type}>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
              {DOCUMENT_TYPE_LABELS[group.type]}
            </p>
            <ul className="space-y-1.5">
              {group.items.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-wine hover:underline truncate"
                  >
                    {isExternalUrl(doc.fileUrl)
                      ? "🔗 "
                      : isImageDocumentUrl(doc.fileUrl)
                        ? "🖼️ "
                        : "📄 "}
                    {getDocumentLinkLabel(doc.docType, doc.title)}
                  </a>
                  {editable && onRemove ? (
                    <button
                      type="button"
                      onClick={() => onRemove(doc.id)}
                      className="shrink-0 text-xs text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

export type { CatalogDocumentType };
