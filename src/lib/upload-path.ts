import path from "path";

/**
 * Returns the base directory for file uploads.
 * In production (Docker) we write to /app/data/uploads so it survives
 * on a persistent volume and the nextjs user has write access.
 * In development we write to <cwd>/public/uploads (served statically).
 */
export function getUploadDir(...segments: string[]): string {
  const base =
    process.env.NODE_ENV === "production"
      ? "/app/data/uploads"
      : path.join(process.cwd(), "public", "uploads");
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
