"use client";

import { motion } from "framer-motion";
import { Check, FileText, Loader2, TriangleAlert, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { UploadDropzone } from "@/components/contracts/upload-dropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useUploadContract } from "@/hooks/use-contracts";
import { ApiError } from "@/lib/api-client";
import { formatFileSize } from "@/lib/utils";
import { validateContractFile } from "@/lib/validation";

type UploadPhase = "pick" | "uploading" | "success" | "error";

/**
 * Upload flow in a dialog — keeps the dashboard loop tight. Every stage has
 * a distinct visual state: pick → uploading (real progress via XHR, then an
 * "extracting" phase while the server parses) → success checkmark → error
 * with the backend's verbatim detail message.
 */
export function UploadContractDialog({ trigger }: { trigger: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const upload = useUploadContract();

  const reset = useCallback(() => {
    setPhase("pick");
    setFile(null);
    setProgress(0);
    setErrorMessage(null);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && upload.isPending) return; // don't allow closing mid-upload
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(nextOpen);
    if (!nextOpen) reset();
  };

  const handleUpload = () => {
    if (!file) return;

    const validation = validateContractFile(file);
    if (!validation.ok) {
      setErrorMessage(validation.message);
      setPhase("error");
      return;
    }

    setPhase("uploading");
    setProgress(0);
    setErrorMessage(null);

    upload.mutate(
      { file, onProgress: setProgress },
      {
        onSuccess: (data) => {
          setPhase("success");
          toast.success("Contract uploaded and text extracted.", {
            description: data.contract_id.original_name,
          });
          closeTimer.current = setTimeout(() => {
            handleOpenChange(false);
            router.push(`/dashboard/contracts/${data.id}`);
          }, 900);
        },
        onError: (error) => {
          const detail =
            error instanceof ApiError
              ? error.detail
              : "Upload failed. Please try again.";
          setErrorMessage(detail);
          setPhase("error");
          toast.error("Upload failed", { description: detail });
        },
      },
    );
  };

  // Upload reached 100% but the server is still extracting text.
  const extracting = phase === "uploading" && progress >= 100;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a contract</DialogTitle>
          <DialogDescription>
            The file is stored, its text is extracted, and it becomes ready for
            Gemini analysis.
          </DialogDescription>
        </DialogHeader>
        {phase === "pick" || phase === "error" ? (
          <>
            <UploadDropzone onFileSelected={setFile} />

            {file ? (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setFile(null)}
                  aria-label="Remove selected file"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : null}

            {phase === "error" && errorMessage ? (
              <p
                className="flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3 py-2.5 text-sm text-destructive"
                role="alert"
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {errorMessage}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!file}>
                <Upload aria-hidden="true" />
                Upload contract
              </Button>
            </div>
          </>
        ) : null}

        {phase === "uploading" ? (
          <div className="flex flex-col gap-4 py-2" aria-live="polite">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {extracting ? "Extracting text on the server…" : `Uploading… ${progress}%`}
                </p>
              </div>
            </div>
            {extracting ? (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/3 animate-pulse-soft rounded-full bg-primary" />
              </div>
            ) : (
              <Progress value={progress} aria-label="Upload progress" />
            )}
          </div>
        ) : null}

        {phase === "success" ? (
          <div className="flex flex-col items-center gap-3 py-6" aria-live="polite">
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 18 }}
              className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Check className="size-7" aria-hidden="true" />
            </motion.span>
            <p className="text-sm font-medium">Uploaded — opening the contract…</p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
