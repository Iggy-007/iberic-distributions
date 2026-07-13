import type { DocumentType } from "@prisma/client";

/** Canonical document types shown in catalog UI */
export const CATALOG_DOCUMENT_TYPES = [
  "FICHA_TECNICA",
  "FOLLETO_INFORMATIVO",
] as const satisfies readonly DocumentType[];

export type CatalogDocumentType = (typeof CATALOG_DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<CatalogDocumentType, string> = {
  FICHA_TECNICA: "Ficha Técnica/Etiqueta",
  FOLLETO_INFORMATIVO: "Folleto informativo",
};

/** Legacy rows migrated from ETIQUETA — still readable until db push runs */
export function isFichaEtiquetaDoc(docType: DocumentType): boolean {
  return docType === "FICHA_TECNICA" || (docType as string) === "ETIQUETA";
}

export function getDocumentTypeLabel(docType: DocumentType): string {
  if (isFichaEtiquetaDoc(docType)) {
    return DOCUMENT_TYPE_LABELS.FICHA_TECNICA;
  }
  if (docType === "FOLLETO_INFORMATIVO") {
    return DOCUMENT_TYPE_LABELS.FOLLETO_INFORMATIVO;
  }
  return docType;
}

export function getDocumentLinkLabel(
  docType: DocumentType,
  title?: string | null
): string {
  const typeLabel = getDocumentTypeLabel(docType);
  if (title?.trim()) return `${typeLabel} — ${title.trim()}`;
  return typeLabel;
}

export function documentsForCatalogType(
  documents: { docType: DocumentType }[],
  catalogType: CatalogDocumentType
) {
  if (catalogType === "FICHA_TECNICA") {
    return documents.filter((d) => isFichaEtiquetaDoc(d.docType));
  }
  return documents.filter((d) => d.docType === catalogType);
}

export function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"] as const;
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png"] as const;

export const DOCUMENT_UPLOAD_ACCEPT: Record<CatalogDocumentType, string> = {
  FICHA_TECNICA: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
  FOLLETO_INFORMATIVO: ".pdf,application/pdf",
};

export const DOCUMENT_UPLOAD_HINT: Record<CatalogDocumentType, string> = {
  FICHA_TECNICA: "PDF, JPG o PNG",
  FOLLETO_INFORMATIVO: "PDF",
};

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

export function isAllowedDocumentFile(
  file: File,
  docType: CatalogDocumentType
): boolean {
  const name = file.name.toLowerCase();
  const ext = extensionOf(name);
  const type = file.type.toLowerCase();

  if (docType === "FOLLETO_INFORMATIVO") {
    return ext === ".pdf" || type === "application/pdf";
  }

  if (ext === ".pdf" || type === "application/pdf") return true;
  if (IMAGE_EXTENSIONS.includes(ext as (typeof IMAGE_EXTENSIONS)[number])) {
    return true;
  }
  return IMAGE_MIME_TYPES.includes(type as (typeof IMAGE_MIME_TYPES)[number]);
}

export function isImageDocumentUrl(url: string): boolean {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.some((ext) => path.endsWith(ext));
}
