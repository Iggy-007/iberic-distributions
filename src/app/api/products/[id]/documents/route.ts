import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { DocumentType, Role } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const linkSchema = z.object({
  fileUrl: z.union([z.string().url(), z.string().regex(/^\//)]),
  docType: z.enum(["FICHA_TECNICA", "ETIQUETA"]),
  title: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
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
        title: parsed.data.title ?? null,
        fileUrl: parsed.data.fileUrl,
      },
    });

    return NextResponse.json(doc, { status: 201 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const docType =
    (formData.get("docType") as DocumentType) || DocumentType.FICHA_TECNICA;
  const title = (formData.get("title") as string) || null;

  if (!file) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "docs");
  await mkdir(uploadsDir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${safeName}`;
  const filePath = path.join(uploadsDir, filename);
  await writeFile(filePath, buffer);

  const doc = await prisma.productDocument.create({
    data: {
      productId: id,
      docType,
      title,
      fileUrl: `/uploads/docs/${filename}`,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const docId = request.nextUrl.searchParams.get("docId");
  if (!docId) {
    return NextResponse.json({ error: "docId requerido" }, { status: 400 });
  }

  const { id: productId } = await params;
  await prisma.productDocument.deleteMany({
    where: { id: docId, productId },
  });

  return NextResponse.json({ ok: true });
}
