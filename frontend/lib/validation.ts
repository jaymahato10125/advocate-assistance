import { z } from "zod";

import {
  ALLOWED_EXTENSIONS,
  ALLOWED_EXTENSIONS_LABEL,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from "@/lib/config";

/**
 * Client-side upload validation, run before any request fires so users get
 * instant feedback. Mirrors the backend's checks in app/routes/contracts.py.
 */
export const uploadFileSchema = z.object({
  name: z
    .string()
    .min(1, "File has no name.")
    .refine(
      (name) =>
        ALLOWED_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext)),
      `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}.`,
    ),
  size: z
    .number()
    .positive("File is empty.")
    .max(
      MAX_FILE_SIZE_BYTES,
      `File exceeds the maximum size of ${MAX_FILE_SIZE_MB} MB.`,
    ),
});

export type FileValidation = { ok: true } | { ok: false; message: string };

export function validateContractFile(file: File): FileValidation {
  const result = uploadFileSchema.safeParse({ name: file.name, size: file.size });
  if (result.success) return { ok: true };
  return {
    ok: false,
    message:
      result.error.issues[0]?.message ??
      `Please choose a ${ALLOWED_EXTENSIONS_LABEL} file.`,
  };
}
