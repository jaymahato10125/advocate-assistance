/**
 * Types mirroring the Vakeel Contracts API (FastAPI) response shapes.
 * Verified against app/models.py and app/routes/*.
 */

export type ContractStatus = "uploaded" | "analyzing" | "analyzed" | "error";

export interface Contract {
  id: string;
  /** Stored (uuid) filename on the server. */
  filename: string;
  /** The uploader's original filename — the human-facing one. */
  original_name: string;
  /** ISO timestamp. */
  upload_date: string;
  /** Full extracted text. Empty string in list responses (omitted server-side). */
  text_content: string;
  page_count: number;
  word_count: number;
  status: ContractStatus;
}

/** POST /contracts/upload response. */
export interface UploadContractResponse {
  message: string;
  /** The backend nests the created contract model under this (misnamed) key. */
  contract_id: Contract;
  id: string;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface ClauseAnalysis {
  clause_title: string;
  clause_text: string;
  explanation: string;
  is_standard: boolean;
}

export interface RiskFlag {
  risk_title: string;
  description: string;
  risk_level: RiskLevel;
  recommendation: string;
  clause_reference: string;
}

export interface AnalysisResult {
  id: string | null;
  contract_id: string;
  analysis_date: string;
  summary: string;
  contract_type: string;
  key_clauses: ClauseAnalysis[];
  risk_flags: RiskFlag[];
  overall_risk_level: RiskLevel;
  recommendations: string[];
}

/** POST /analysis/analyze/{contract_id} response. */
export interface AnalyzeContractResponse {
  message: string;
  analysis: AnalysisResult;
  id: string;
}
