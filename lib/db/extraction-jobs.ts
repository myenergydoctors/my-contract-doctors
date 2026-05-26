"use client";
import { createClient } from "@/lib/supabase/client";

export type ExtractionJobForUI = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  attempts: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  rawAiResponse: unknown | null;
  aiModel: string | null;
  aiTokensInput: number | null;
  aiTokensOutput: number | null;
  aiCostCents: number | null;
};

export async function getExtractionJobForInvoice(invoiceId: string): Promise<ExtractionJobForUI | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoice_extraction_jobs")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    status: data.status,
    attempts: data.attempts,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    errorMessage: data.error_message,
    rawAiResponse: data.raw_ai_response,
    aiModel: data.ai_model,
    aiTokensInput: data.ai_tokens_input,
    aiTokensOutput: data.ai_tokens_output,
    aiCostCents: data.ai_cost_cents,
  };
}

// Creates a short-lived signed URL for viewing the original uploaded file.
// The file_path on invoice_analyses is "{bucket}/{user_id}/{file}" — we
// need to split it out.
export async function getInvoiceFileSignedUrl(filePath: string): Promise<string | null> {
  if (!filePath) return null;
  const slashIdx = filePath.indexOf("/");
  if (slashIdx === -1) return null;
  const bucket = filePath.slice(0, slashIdx);
  const pathInBucket = filePath.slice(slashIdx + 1);

  const supabase = createClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(pathInBucket, 60 * 10); // 10 minutes
  if (error || !data) return null;
  return data.signedUrl;
}
