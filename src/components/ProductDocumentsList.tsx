import type { DocumentType } from "@prisma/client";
import {
  DOCUMENT_TYPE_LABELS,
  getDocumentLinkLabel,
  isExternalUrl,
} from "@/lib/documents";

export interface ProductDocumentItem {
  id: string;
  docType: DocumentType;
  title: string | null;
  fileUrl: string;
}

export function ProductDocumentsList({
  documents,
}: {
  documents: ProductDocumentItem[];
}) {
  if (documents.length === 0) return null;

  const grouped = (["FICHA_TECNICA", "ETIQUETA"] as DocumentType[])
    .map((type) => ({
      type,
      items: documents.filter((d) => d.docType === type),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Documentación</p>
      {grouped.map((group) => (
        <div key={group.type}>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">
            {DOCUMENT_TYPE_LABELS[group.type]}
          </p>
          <ul className="space-y-1">
            {group.items.map((d) => (
              <li key={d.id}>
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-wine hover:underline"
                >
                  {isExternalUrl(d.fileUrl)
                    ? `🔗 ${getDocumentLinkLabel(d.docType, d.title)}`
                    : `📄 ${getDocumentLinkLabel(d.docType, d.title)}`}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
