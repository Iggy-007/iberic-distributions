import type { DocumentType } from "@prisma/client";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  FICHA_TECNICA: "Ficha técnica",
  ETIQUETA: "Etiqueta",
};

export function getDocumentLinkLabel(
  docType: DocumentType,
  title?: string | null
): string {
  const typeLabel = DOCUMENT_TYPE_LABELS[docType];
  if (title?.trim()) return `${typeLabel} — ${title.trim()}`;
  return typeLabel;
}

export function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}
