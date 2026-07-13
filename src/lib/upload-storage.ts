import path from "path";

export const UPLOAD_DOCS_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "docs"
);

export const UPLOAD_DOCS_URL_PREFIX = "/uploads/docs";

export function uploadDocsFileUrl(filename: string): string {
  return `${UPLOAD_DOCS_URL_PREFIX}/${filename}`;
}

export function resolveUploadDocPath(filename: string): string {
  const safeName = path.basename(filename);
  const filePath = path.resolve(UPLOAD_DOCS_DIR, safeName);
  const root = path.resolve(UPLOAD_DOCS_DIR);

  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    throw new Error("Invalid upload path");
  }

  return filePath;
}

export const UPLOAD_MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export function mimeTypeForFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return UPLOAD_MIME_BY_EXT[ext] ?? "application/octet-stream";
}
