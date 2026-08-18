/**
 * Client-side mirrors of the backend's configurable upload constraints.
 * Keep these in sync with the FastAPI env vars (ALLOWED_EXTENSIONS,
 * MAX_FILE_SIZE_MB) — they are intentionally named constants so a backend
 * config change is a one-line edit here.
 */
export const ALLOWED_EXTENSIONS = [".pdf", ".txt"] as const;

export const MAX_FILE_SIZE_MB = 10;

export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * In dev, requests go through the Next.js rewrite proxy at /api (see
 * next.config.ts). In production, set NEXT_PUBLIC_API_BASE_URL.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

const EXTENSION_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

/** react-dropzone `accept` map built from ALLOWED_EXTENSIONS. */
export const DROPZONE_ACCEPT: Record<string, string[]> = ALLOWED_EXTENSIONS.reduce<
  Record<string, string[]>
>((acc, ext) => {
  const mime = EXTENSION_TO_MIME[ext] ?? "application/octet-stream";
  acc[mime] = [...(acc[mime] ?? []), ext];
  return acc;
}, {});

export const ALLOWED_EXTENSIONS_LABEL = ALLOWED_EXTENSIONS.map((ext) =>
  ext.replace(".", "").toUpperCase(),
).join(" or ");
