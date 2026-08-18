import { API_BASE_URL } from "@/lib/config";
import type {
  AnalyzeContractResponse,
  AnalysisResult,
  Contract,
  UploadContractResponse,
} from "@/types/contract";

/**
 * API error that preserves the backend's `detail` message verbatim.
 * FastAPI returns { detail: string } for HTTPExceptions (including the 502s
 * from failed Gemini analyses) and { detail: [{ msg, loc, ... }] } for
 * request-validation errors — both are surfaced faithfully.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

const NETWORK_ERROR_DETAIL =
  "Could not reach the API. Make sure the FastAPI server is running on 127.0.0.1:8000.";

function extractDetail(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((entry) =>
          entry && typeof entry === "object" && "msg" in entry
            ? String((entry as { msg: unknown }).msg)
            : JSON.stringify(entry),
        )
        .join("; ");
    }
    return String(detail);
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR_DETAIL);
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}.`;
    try {
      detail = extractDetail(await response.json(), detail);
    } catch {
      // Non-JSON error body — keep the fallback.
    }
    throw new ApiError(response.status, detail);
  }

  return (await response.json()) as T;
}

/**
 * Upload uses XMLHttpRequest (rather than fetch) so we get real upload
 * progress events for the dropzone progress bar.
 */
function uploadContract(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadContractResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/contracts/upload`);
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };

    xhr.onload = () => {
      const payload: unknown = xhr.response;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload as UploadContractResponse);
      } else {
        reject(
          new ApiError(
            xhr.status,
            extractDetail(payload, `Upload failed with status ${xhr.status}.`),
          ),
        );
      }
    };

    xhr.onerror = () => reject(new ApiError(0, NETWORK_ERROR_DETAIL));

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export const api = {
  listContracts: () => request<Contract[]>("/contracts/"),
  getContract: (id: string) => request<Contract>(`/contracts/${id}`),
  getAnalysisByContract: (contractId: string) =>
    request<AnalysisResult>(`/analysis/contracts/${contractId}`),
  getAnalysis: (id: string) => request<AnalysisResult>(`/analysis/${id}`),
  analyzeContract: (id: string) =>
    request<AnalyzeContractResponse>(`/analysis/analyze/${id}`, { method: "POST" }),
  uploadContract,
};
