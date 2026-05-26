import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { listProductsServer } from "@/lib/db/products";
import { listVendorsServer } from "@/lib/db/vendors";

// Allow up to 300s for the extraction (Vercel Pro). Claude calls on large
// PDFs can take a while.
export const maxDuration = 300;

// Anthropic pricing for cost tracking (Sonnet 4 — match the chat route)
const MODEL = "claude-sonnet-4-20250514";
const INPUT_COST_PER_M = 3.0;   // $3 per 1M input tokens
const OUTPUT_COST_PER_M = 15.0; // $15 per 1M output tokens
function calcCostCents(inputTokens: number, outputTokens: number): number {
  const dollars = (inputTokens * INPUT_COST_PER_M / 1_000_000) + (outputTokens * OUTPUT_COST_PER_M / 1_000_000);
  return Math.round(dollars * 100);
}

type ExtractRequestBody = {
  storage_path: string;        // e.g. "invoices/{user_id}/12345-invoice.pdf"
  bucket?: string;             // defaults to 'invoices'
  business_hint?: string;      // user-supplied business name
  vendor_hint?: string;        // user-supplied vendor (helps Claude lock in)
  state_hint?: string;         // 2-letter US state if known
};

type AILineItem = {
  raw_label: string;
  product_slug?: string;
  vendor_slug?: string;
  quantity?: number;
  unit_price_cents?: number;
  billing_frequency?: "per-event" | "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annual" | "one-time";
  annual_cost_cents?: number;
  flagged?: boolean;
  flag_reason?: string;
  flag_severity?: "high" | "medium" | "low";
  suggested_action?: string;
  estimated_savings_cents?: number;
};

type AIResponse = {
  document_type: "invoice" | "agreement" | "statement" | "purchase-order" | "receipt" | "other";
  document_type_reason?: string;
  vendor_name?: string;
  vendor_slug?: string;
  invoice_number?: string;
  invoice_date?: string;
  service_state?: string;
  service_zip?: string;
  monthly_total_cents?: number;
  line_items?: AILineItem[];
  top_finding?: string;
  potential_annual_savings_cents?: number;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is not configured for AI extraction." }, { status: 500 });
  }

  // 1) Authenticate the request
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // 2) Parse request
  const body = (await req.json()) as ExtractRequestBody;
  if (!body.storage_path) {
    return NextResponse.json({ error: "storage_path is required." }, { status: 400 });
  }
  const bucket = body.bucket || "invoices";

  // 3) Security: the path must be inside the user's own folder
  const expectedPrefix = `${user.id}/`;
  if (!body.storage_path.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "Forbidden: path does not match user." }, { status: 403 });
  }

  // Use the user-session client throughout. RLS policies on these tables
  // allow users to insert/select/update rows where user_id = auth.uid(),
  // and storage policies allow users to read files in their own folder.
  // No need to bypass RLS via service_role for normal user-scoped work.

  // 4) Create the invoice row + extraction job first so we have IDs to attach progress to
  const { data: invoiceRow, error: invErr } = await supabase
    .from("invoice_analyses")
    .insert({
      user_id: user.id,
      status: "processing",
      file_path: `${bucket}/${body.storage_path}`,
    })
    .select("id")
    .single();
  if (invErr || !invoiceRow) {
    console.error("Failed to create invoice row:", invErr);
    return NextResponse.json({
      error: "create_analysis_failed",
      message: `Could not create analysis record: ${invErr?.message || "unknown error"}`,
      code: invErr?.code,
      details: invErr?.details,
      hint: invErr?.hint,
    }, { status: 500 });
  }
  const invoiceId: string = invoiceRow.id;

  const { data: jobRow, error: jobErr } = await supabase
    .from("invoice_extraction_jobs")
    .insert({
      invoice_id: invoiceId,
      user_id: user.id,
      status: "processing",
      attempts: 1,
      started_at: new Date().toISOString(),
      ai_model: MODEL,
    })
    .select("id")
    .single();
  if (jobErr) {
    console.error("Failed to create extraction job:", jobErr);
  }
  const jobId: string | undefined = jobRow?.id;

  try {
    // 5) Download the file from storage
    const { data: fileBlob, error: dlErr } = await supabase.storage.from(bucket).download(body.storage_path);
    if (dlErr || !fileBlob) {
      throw new Error(`Could not download file: ${dlErr?.message || "unknown error"}`);
    }
    const arrayBuf = await fileBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuf).toString("base64");
    const mediaType = fileBlob.type || guessMediaType(body.storage_path);
    const isPdf = mediaType === "application/pdf";

    // 6) Build the AI prompt with product + vendor taxonomy
    const [products, vendors] = await Promise.all([listProductsServer(), listVendorsServer()]);

    const productList = products
      .map(p => `  ${p.slug}: ${p.name}${p.subcategory ? ` (${p.subcategory})` : ""}`)
      .join("\n");
    const vendorList = vendors
      .map(v => `  ${v.slug}: ${v.name}${v.aliases.length ? ` [also: ${v.aliases.join(", ")}]` : ""}`)
      .join("\n");

    const systemPrompt = `You are an analyst at My Contract Doctors. The user uploaded a document and we need to determine what it is and extract structured data if it's an INVOICE.

STEP 1: Classify the document first.
- "invoice" — a periodic bill from a service vendor with line items, quantities, prices, and a total amount due. Typically labeled "Invoice" with a number, billing period, line items.
- "agreement" — a contract or service agreement. Has clauses, terms, signatures. NOT what we want here (the user should upload to the /agreement flow instead).
- "statement" — a summary of charges over a period, not a bill itself
- "purchase-order" — order placed with a vendor, not a bill from them
- "receipt" — proof of single payment
- "other" — anything else (random photo, illegible, not service-related, etc.)

If document_type is NOT "invoice", STOP. Return just:
{
  "document_type": "agreement" (or whatever it is),
  "document_type_reason": "1 sentence explaining what you saw"
}

STEP 2 (only if it IS an invoice): Extract structured data.

Your job:
1. Identify the vendor and map it to one of our vendor slugs (use 'other' only if truly unrecognized)
2. Extract every line item and map each to one of our product slugs
3. Flag items that are above-market or worth knowing about
4. Return STRICT JSON only — no commentary, no markdown fences

Available vendor slugs:
${vendorList}

Available product slugs:
${productList}

Flagging severity guide (consultative, never accusatory):
- "high": Item priced clearly above market, surcharges added that aren't standard, or fees with no apparent contractual basis
- "medium": Pricing escalators that compound annually without a cap, minimum billing applied during low-usage periods
- "low": Standard rate but worth understanding before renewal

CRITICAL TONE RULES:
- Frame everything consultatively — we help clients understand pricing and negotiate
- NEVER accuse the vendor of overcharging, scamming, or wrongdoing
- Use phrases like "above industry average", "worth reviewing", "negotiation opportunity"
- Suggested actions describe what the CLIENT can do, not what the vendor did wrong

Return JSON matching this exact schema (omit fields you can't determine, BUT always include document_type):
{
  "document_type": "invoice",
  "vendor_name": "string",
  "vendor_slug": "best matching slug or 'other'",
  "invoice_number": "string",
  "invoice_date": "YYYY-MM-DD",
  "service_state": "2-letter US state code (e.g. VT)",
  "service_zip": "string",
  "monthly_total_cents": integer,
  "line_items": [
    {
      "raw_label": "verbatim text from invoice",
      "product_slug": "best matching slug",
      "vendor_slug": "same as top-level vendor_slug usually",
      "quantity": number,
      "unit_price_cents": integer,
      "billing_frequency": "weekly|bi-weekly|monthly|quarterly|annual|per-event|one-time",
      "annual_cost_cents": integer,
      "flagged": true | false,
      "flag_reason": "1 sentence, consultative",
      "flag_severity": "high|medium|low",
      "suggested_action": "1 sentence — what the client can do",
      "estimated_savings_cents": integer
    }
  ],
  "top_finding": "1-2 sentences summarizing the biggest opportunity, consultative tone",
  "potential_annual_savings_cents": integer
}`;

    const userPrompt = `Extract the invoice below.

Business hint: ${body.business_hint || "(not provided)"}
Vendor hint: ${body.vendor_hint || "(not provided)"}
State hint: ${body.state_hint || "(not provided)"}

Return strict JSON only.`;

    const fileBlock = isPdf
      ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 } }
      : { type: "image" as const, source: { type: "base64" as const, media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: base64 } };

    // 7) Call Claude
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: [
            fileBlock,
            { type: "text", text: userPrompt },
          ],
        }],
      }),
    });

    const aiJson = await aiRes.json();
    if (!aiRes.ok) {
      throw new Error(`Anthropic API error: ${aiJson?.error?.message || aiRes.statusText}`);
    }

    const text: string = aiJson.content?.[0]?.text || "";
    const usage = aiJson.usage || {};
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    const costCents = calcCostCents(inputTokens, outputTokens);

    // 8) Parse the JSON (strip any accidental code fences)
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    let parsed: AIResponse;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      throw new Error(`Could not parse AI response as JSON. Raw text: ${cleaned.slice(0, 500)}`);
    }

    // 8a) Classification gate — if the document isn't an invoice, abort cleanly
    if (parsed.document_type && parsed.document_type !== "invoice") {
      await supabase
        .from("invoice_analyses")
        .update({
          status: "failed",
          top_finding: `Detected as ${parsed.document_type} — not an invoice.`,
          raw_analysis: parsed as unknown as object,
        })
        .eq("id", invoiceId);
      if (jobId) {
        await supabase
          .from("invoice_extraction_jobs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: `wrong_document_type: ${parsed.document_type}`,
            raw_ai_response: parsed as unknown as object,
            ai_tokens_input: inputTokens,
            ai_tokens_output: outputTokens,
            ai_cost_cents: costCents,
          })
          .eq("id", jobId);
      }
      return NextResponse.json({
        error: "wrong_document_type",
        detected_type: parsed.document_type,
        reason: parsed.document_type_reason || null,
        // The user can re-upload to the right flow without re-uploading the file:
        storage_path: body.storage_path,
        bucket,
      }, { status: 422 });
    }

    // 9) Map slugs to UUIDs
    const productBySlug = new Map(products.map(p => [p.slug, p.id]));
    const vendorBySlug = new Map(vendors.map(v => [v.slug, v.id]));
    const vendorIdTop = parsed.vendor_slug ? vendorBySlug.get(parsed.vendor_slug) : undefined;

    // 10) Update the invoice row with summary data
    const flaggedCount = (parsed.line_items || []).filter(li => li.flagged).length;
    await supabase
      .from("invoice_analyses")
      .update({
        status: "completed",
        vendor: parsed.vendor_name ?? null,
        vendor_id: vendorIdTop ?? null,
        invoice_number: parsed.invoice_number ?? null,
        invoice_date: parsed.invoice_date ?? null,
        state: parsed.service_state ?? body.state_hint ?? null,
        zip: parsed.service_zip ?? null,
        total_spend_cents: parsed.monthly_total_cents ?? null,
        potential_annual_savings_cents: parsed.potential_annual_savings_cents ?? null,
        flagged_item_count: flaggedCount,
        top_finding: parsed.top_finding ?? null,
        raw_analysis: parsed as unknown as object,
      })
      .eq("id", invoiceId);

    // 11) Insert line items in one batch
    const lineRows = (parsed.line_items || []).map(li => ({
      invoice_id: invoiceId,
      user_id: user.id,
      raw_label: li.raw_label || "(unknown)",
      product_id: li.product_slug ? productBySlug.get(li.product_slug) ?? null : null,
      vendor_id: li.vendor_slug ? vendorBySlug.get(li.vendor_slug) ?? vendorIdTop ?? null : vendorIdTop ?? null,
      quantity: li.quantity ?? null,
      unit_price_cents: li.unit_price_cents ?? null,
      billing_frequency: li.billing_frequency ?? null,
      annual_cost_cents: li.annual_cost_cents ?? null,
      state: parsed.service_state ?? body.state_hint ?? null,
      zip: parsed.service_zip ?? null,
      flagged: !!li.flagged,
      flag_reason: li.flag_reason ?? null,
      flag_severity: li.flag_severity ?? null,
      suggested_action: li.suggested_action ?? null,
      estimated_savings_cents: li.estimated_savings_cents ?? null,
    }));
    if (lineRows.length > 0) {
      const { error: liErr } = await supabase.from("invoice_line_items").insert(lineRows);
      if (liErr) console.error("Failed to insert line items:", liErr);
    }

    // 12) Complete the job
    if (jobId) {
      await supabase
        .from("invoice_extraction_jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          raw_ai_response: parsed as unknown as object,
          ai_tokens_input: inputTokens,
          ai_tokens_output: outputTokens,
          ai_cost_cents: costCents,
        })
        .eq("id", jobId);
    }

    return NextResponse.json({
      ok: true,
      invoice_id: invoiceId,
      line_item_count: lineRows.length,
      flagged_count: flaggedCount,
      potential_annual_savings_cents: parsed.potential_annual_savings_cents ?? 0,
      cost_cents: costCents,
    });
  } catch (err: any) {
    console.error("Extraction failed:", err);
    // Mark invoice + job as failed
    await supabase
      .from("invoice_analyses")
      .update({ status: "failed", top_finding: `Extraction failed: ${err?.message || String(err)}` })
      .eq("id", invoiceId);
    if (jobId) {
      await supabase
        .from("invoice_extraction_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: err?.message || String(err),
        })
        .eq("id", jobId);
    }
    return NextResponse.json({ error: "extraction_failed", message: err?.message || "Extraction failed" }, { status: 500 });
  }
}

function guessMediaType(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "image/jpeg";
}
