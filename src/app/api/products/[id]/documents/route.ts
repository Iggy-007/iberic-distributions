import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { DocumentType } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCatalog } from "@/lib/catalog-permissions";
import { notifyAdminsOfCatalogChange } from "@/lib/catalog-notifications";
import {
  CATALOG_DOCUMENT_TYPES,
  getDocumentTypeLabel,
  isAllowedDocumentFile,
  type CatalogDocumentType,
} from "@/lib/documents";
import {
  UPLOAD_DOCS_DIR,
  uploadDocsFileUrl,
  resolveUploadDocPath,
} from "@/lib/upload-storage";

const docTypeSchema = z.enum(CATALOG_DOCUMENT_TYPES);

const linkSchema = z.object({
  fileUrl: z.union([z.string().url(), z.string().regex(/^\//)]),
  docType: docTypeSchema,
  title: z.string().optional(),
});

function parseDocType(value: FormDataEntryValue | null): CatalogDocumentType | null {
  if (typeof value !== "string") return null;
  const parsed = docTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

async function getProductName(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true },
  });
  return product?.name ?? "Producto";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !canManageCatalog(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    const parsed = linkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const doc = await prisma.productDocument.create({
      data: {
        productId: id,
        docType: parsed.data.docType as DocumentType,
        title: parsed.data.title?.trim() || null,
        fileUrl: parsed.data.fileUrl.trim(),
      },
    });

    await notifyAdminsOfCatalogChange({
      type: "PRODUCT_DOCUMENT_ADDED",
      summary: `Documento añadido a ${product.name}`,
      detail: parsed.data.title ?? getDocumentTypeLabel(parsed.data.docType),
      productId: id,
      actorUserId: session.user.id,
    });

    return NextResponse.json(doc, { status: 201 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const docType = parseDocType(formData.get("docType"));
  const title = (formData.get("title") as string | null)?.trim() || null;

  if (!docType) {
    return NextResponse.json({ error: "Tipo de documento no válido" }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  if (!isAllowedDocumentFile(file, docType)) {
    return NextResponse.json(
      {
        error:
          docType === "FICHA_TECNICA"
            ? "Solo se permiten archivos PDF, JPG o PNG"
            : "Solo se permiten archivos PDF",
      },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${safeName}`;

  try {
    await mkdir(UPLOAD_DOCS_DIR, { recursive: true });
    await writeFile(resolveUploadDocPath(filename), buffer);
  } catch (error) {
    console.error("Upload write failed:", error);
    return NextResponse.json(
      { error: "No se pudo guardar el archivo en el servidor" },
      { status: 500 }
    );
  }

  const doc = await prisma.productDocument.create({
    data: {
      productId: id,
      docType,
      title,
      fileUrl: uploadDocsFileUrl(filename),
    },
  });

  await notifyAdminsOfCatalogChange({
    type: "PRODUCT_DOCUMENT_ADDED",
    summary: `Documento subido a ${product.name}`,
    detail: title ?? getDocumentTypeLabel(docType),
    productId: id,
    actorUserId: session.user.id,
  });

  return NextResponse.json(doc, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !canManageCatalog(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const docId = request.nextUrl.searchParams.get("docId");
  if (!docId) {
    return NextResponse.json({ error: "docId requerido" }, { status: 400 });
  }

  const { id: productId } = await params;
  const doc = await prisma.productDocument.findFirst({
    where: { id: docId, productId },
  });

  await prisma.productDocument.deleteMany({
    where: { id: docId, productId },
  });

  if (doc) {
    const productName = await getProductName(productId);
    await notifyAdminsOfCatalogChange({
      type: "PRODUCT_DOCUMENT_REMOVED",
      summary: `Documento eliminado de ${productName}`,
      detail: doc.title ?? getDocumentTypeLabel(doc.docType),
      productId,
      actorUserId: session.user.id,
    });
  }

  return NextResponse.json({ ok: true });
}
