import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "docs");

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  if (!segments?.length) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (segments.some((segment) => segment.includes(".."))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const relativePath = segments.join("/");
  const filePath = path.resolve(UPLOAD_ROOT, relativePath);

  if (!filePath.startsWith(path.resolve(UPLOAD_ROOT) + path.sep) &&
      filePath !== path.resolve(UPLOAD_ROOT)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    return new NextResponse(data, {
      headers: {
        "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
