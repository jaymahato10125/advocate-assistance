"use client";

import { FileUp, TriangleAlert } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

import {
  ALLOWED_EXTENSIONS_LABEL,
  DROPZONE_ACCEPT,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from "@/lib/config";
import { cn } from "@/lib/utils";
import { validateContractFile } from "@/lib/validation";

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

/**
 * Keyboard-navigable dropzone. The dashed border glows and tightens on
 * drag-over; invalid drops surface an inline message immediately (files are
 * validated with zod before any request is ever fired).
 */
export function UploadDropzone({ onFileSelected, disabled }: UploadDropzoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: { file: File }[]) => {
      const candidate = acceptedFiles[0] ?? fileRejections[0]?.file;
      if (!candidate) return;

      const validation = validateContractFile(candidate);
      if (!validation.ok) {
        setError(validation.message);
        return;
      }
      setError(null);
      onFileSelected(candidate);
    },
    [onFileSelected],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: DROPZONE_ACCEPT,
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    disabled,
  });

  const showError = error !== null || isDragReject;

  return (
    <div>
      <div
        {...getRootProps({
          "aria-label": `Upload a contract. ${ALLOWED_EXTENSIONS_LABEL} files up to ${MAX_FILE_SIZE_MB} megabytes.`,
          className: cn(
            "group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border px-6 py-10 text-center transition-all duration-200 outline-none",
            "hover:border-primary/50 hover:bg-primary/[0.03]",
            "focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15",
            isDragActive &&
              "border-primary bg-primary/[0.06] ring-4 ring-primary/15 scale-[0.99]",
            showError &&
              "border-destructive/60 bg-destructive/[0.04] hover:border-destructive/60",
            disabled && "pointer-events-none opacity-50",
          ),
        })}
      >
        <input {...getInputProps()} />
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors duration-200",
            isDragActive && "bg-primary/10 text-primary",
          )}
        >
          <FileUp className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-medium">
          {isDragActive ? "Drop the contract to select it" : "Drag and drop your contract here"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          or <span className="font-medium text-primary underline underline-offset-4">browse files</span>{" "}
          — {ALLOWED_EXTENSIONS_LABEL}, up to {MAX_FILE_SIZE_MB} MB
        </p>
      </div>

      {error ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-destructive" role="alert">
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
