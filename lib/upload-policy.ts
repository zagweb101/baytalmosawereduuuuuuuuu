const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "application/zip",
]);

const MAX_BYTES_BY_MIME: Record<string, number> = {
  "image/jpeg": 10 * 1024 * 1024,
  "image/png": 10 * 1024 * 1024,
  "image/webp": 10 * 1024 * 1024,
  "image/gif": 10 * 1024 * 1024,
  "video/mp4": 100 * 1024 * 1024,
  "video/webm": 100 * 1024 * 1024,
  "application/pdf": 25 * 1024 * 1024,
  "application/zip": 50 * 1024 * 1024,
};

export function sanitizeUploadFolder(folder: string): string {
  const cleaned = folder
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]/g, "")
    .replace(/\.\./g, "")
    .replace(/^\/+|\/+$/g, "");

  return cleaned || "uploads";
}

export function validateUploadFile(
  file: File,
): { ok: true } | { ok: false; error: string } {
  const mime = file.type || "application/octet-stream";

  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, error: "نوع الملف غير مدعوم" };
  }

  const maxBytes = MAX_BYTES_BY_MIME[mime] ?? 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `حجم الملف يتجاوز الحد المسموح (${Math.round(maxBytes / (1024 * 1024))} ميجابايت)`,
    };
  }

  return { ok: true };
}
