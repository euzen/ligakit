import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const filePath = path.join("/app/data/uploads", ...segments);

  // Prevent path traversal
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith("/app/data/uploads")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const data = await readFile(resolved);
    const ext = resolved.split(".").pop()?.toLowerCase() ?? "";
    const contentType = MIME[ext] ?? "application/octet-stream";
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
