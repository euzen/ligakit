import path from "path";

/**
 * Returns the base directory for file uploads.
 *
 * Priority:
 *  1. UPLOAD_DIR env var  (set explicitly per platform)
 *  2. production default  → /app/data/uploads  (Docker / Back4App)
 *  3. development default → <cwd>/public/uploads
 */
export function getUploadDir(...segments: string[]): string {
  const base =
    process.env.UPLOAD_DIR ??
    (process.env.NODE_ENV === "production"
      ? "/app/data/uploads"
      : path.join(process.cwd(), "public", "uploads"));
  return path.join(base, ...segments);
}

/**
 * Returns the public URL for an uploaded file.
 * In production files are served via the /api/uploads/[...path] route.
 * In development Next.js serves the public/ folder directly.
 */
export function getUploadUrl(category: string, fileName: string): string {
  if (process.env.NODE_ENV === "production") {
    return `/api/uploads/${category}/${fileName}`;
  }
  return `/uploads/${category}/${fileName}`;
}
