import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  UPLOAD_DOCS_DIR,
  mimeTypeForFilename,
} from "@/lib/upload-storage";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  if (!segments?.length || segments.some((segment) => segment.includes(".."))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const relativePath = segments.map((segment) => path.basename(segment)).join("/");
  const filePath = path.resolve(UPLOAD_DOCS_DIR, relativePath);
  const root = path.resolve(UPLOAD_DOCS_DIR);

  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await readFile(filePath);

    return new NextResponse(data, {
      headers: {
        "Content-Type": mimeTypeForFilename(filePath),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
