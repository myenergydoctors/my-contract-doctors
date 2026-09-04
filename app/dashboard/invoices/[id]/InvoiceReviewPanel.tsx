"use client";

import { useCallback, useEffect, useState } from "react";
import {
  INVOICE_LINE_TYPES,
  type EditableInvoiceLineFields,
  type InvoiceLineType,
  type InvoiceReviewDTO,
  type InvoiceReviewLine,
  type InvoiceReviewStatus,
} from "@/lib/invoice-review";
import ServiceReplacementConfirmation, {
  createReplacementDrafts,
  replacementDraftsComplete,
  toReplacementConfirmationInputs,
  type ReplacementDraft,
  type ReplacementTrackingReview,
} from "./ServiceReplacementConfirmation";

const FREQUENCIES = ["per-event", "weekly", "bi-weekly", "monthly", "quarterly", "annual", "one-time"];
const LINE_TYPE_LABEL: Record<InvoiceLineType, string> = {
  charge: "Charge",
  credit: "Credit",
  past_balance: "Past balance",
  late_fee: "Late fee",
  discount: "Discount",
  tax: "Tax",
  other: "Other",
};

type Props = {
  invoiceId: string;
  isPro: boolean;
  onStatusChange: (status: InvoiceReviewStatus | null) => void;
};

export default function InvoiceReviewPanel({ invoiceId, isPro, onStatusChange }: Props) {
  const [review, setReview] = useState<InvoiceReviewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [adding, setAdding] = useState(false);
  const [replacementTracking, setReplacementTracking] = useState<ReplacementTrackingReview | null>(null);
  const [replacementDrafts, setReplacementDrafts] = useState<ReplacementDraft[]>([]);
  const [replacementError, setReplacementError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/review`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.code === "review_schema_unavailable" ? "Invoice review needs the new database migrations before it can run." : data.error || "Could not load invoice review.");
      setReview(data.review);
      onStatusChange(data.review.status);
      setExpanded(data.review.status !== "confirmed");
      if (isPro) {
        const replacementResponse = await fetch(`/api/invoices/${invoiceId}/replacement-history`, { cache: "no-store" });
        const replacementData = await replacementResponse.json();
        if (!replacementResponse.ok) {
          setReplacementError(replacementData.error || "Could not load service and replacement history.");
          setReplacementTracking(null);
        } else {
          const tracking = replacementData.replacementHistory as ReplacementTrackingReview;
          setReplacementTracking(tracking);
          setReplacementDrafts(createReplacementDrafts(tracking.items));
          setReplacementError(null);
        }
      } else {
        setReplacementTracking(null);
        setReplacementDrafts([]);
        setReplacementError(null);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load invoice review.");
      onStatusChange(null);
    } finally {
      setLoading(false);
    }
  }, [invoiceId, isPro, onStatusChange]);

  useEffect(() => { void load(); }, [load]);

  async function act(body: object) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save the review.");
      setReview(data.review);
      onStatusChange(data.review.status);
      return data.review as InvoiceReviewDTO;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the review.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 font-sans text-sm text-gray-500">Preparing your invoice review…</div>;
  }

  if (!review) {
    return (
      <div className="mb-8 rounded-2xl border-2 border-red/30 bg-red-light p-6">
        <div className="font-serif text-xl text-navy mb-2">Review is not available yet</div>
        <div className="font-sans text-sm text-gray-700">{error}</div>
        <button onClick={() => void load()} className="mt-4 rounded-lg bg-navy px-4 py-2 font-sans text-sm font-medium text-white cursor-pointer">Try again</button>
      </div>
    );
  }

  const confirmed = review.status === "confirmed";
  const replacementRequired = isPro && !!replacementTracking && replacementTracking.items.length > 0 && !replacementTracking.alreadyAnswered;
  const replacementComplete = !replacementRequired || replacementDraftsComplete(replacementTracking.items, replacementDrafts);
  const hasMultipleDetectedDocuments = review.documentSegments.length > 1 || review.documentSegments.some(segment => segment.documentType !== "invoice");
  const hasDocumentCompletenessConcern = review.documentSegments.some(segment => segment.documentType === "invoice" && segment.completenessStatus !== "complete");
  return (
    <section className={`mb-8 overflow-hidden rounded-2xl border-2 ${confirmed ? "border-teal/30" : review.redIssueCount > 0 ? "border-red/30" : "border-amber/40"} bg-white`}>
      <div className={`px-5 py-4 ${confirmed ? "bg-teal-light" : "bg-off-white"} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}>
        <div>
          <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Required invoice review</div>
          <div className="font-serif text-xl text-navy mt-1">{confirmed ? "Invoice data confirmed" : "Check what we read from your invoice"}</div>
          <div className="font-sans text-xs text-gray-600 mt-1">
            {confirmed
              ? `Confirmed${review.reviewedAt ? ` ${new Date(review.reviewedAt).toLocaleString()}` : ""}. Analysis is now unlocked.`
              : `${review.redIssueCount} required correction${review.redIssueCount === 1 ? "" : "s"} · ${review.yellowIssueCount} item${review.yellowIssueCount === 1 ? "" : "s"} worth checking`}
          </div>
        </div>
        {confirmed && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setExpanded(value => !value)} className="rounded-lg border border-teal/30 bg-white px-4 py-2 font-sans text-sm font-medium text-navy cursor-pointer">
              {expanded ? "Hide reviewed data" : "View reviewed data"}
            </button>
            <button onClick={() => void act({ action: "reopen" })} className="rounded-lg bg-navy px-4 py-2 font-sans text-sm font-medium text-white cursor-pointer">
              Make a correction
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="p-5">
          {(hasMultipleDetectedDocuments || hasDocumentCompletenessConcern) && (
            <div className={`mb-5 rounded-xl border p-4 ${review.documentSegments.some(segment => segment.documentType === "invoice" && segment.completenessStatus === "incomplete") ? "border-red/30 bg-red-light/40" : hasDocumentCompletenessConcern ? "border-amber/40 bg-amber/10" : "border-blue/25 bg-blue-pale/40"}`}>
              <div className="font-sans text-xs font-semibold text-navy">
                {hasDocumentCompletenessConcern ? "Check the pages included in this upload" : "We found more than one document in this upload"}
              </div>
              <div className="mt-1 font-sans text-xs leading-5 text-gray-600">
                {hasDocumentCompletenessConcern
                  ? "We compare printed page numbers with the pages that were uploaded. Missing invoice pages must be added before analysis."
                  : "Each page range is kept separate so agreement language is not mistaken for an invoice charge."}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {review.documentSegments.map(segment => {
                  const invoiceCompletenessConcern = segment.documentType === "invoice" && segment.completenessStatus !== "complete";
                  const segmentTone = segment.documentType === "invoice" && segment.completenessStatus === "incomplete"
                    ? "border-red/40 bg-white text-red"
                    : invoiceCompletenessConcern
                      ? "border-amber/40 bg-white text-amber-800"
                      : "border-blue/25 bg-white text-navy";
                  const completenessLabel = segment.documentType !== "invoice"
                    ? ""
                    : segment.completenessStatus === "incomplete"
                    ? "missing page"
                    : segment.completenessStatus === "possibly_incomplete" ? "check pages" : "complete";
                  return (
                    <span key={segment.id} title={segment.completenessNotes || undefined} className={`rounded-full border px-3 py-1 font-sans text-xs ${segmentTone}`}>
                      Pages {segment.pageStart}{segment.pageEnd !== segment.pageStart ? `–${segment.pageEnd}` : ""}: {segment.documentType.replace("-", " ")}{completenessLabel ? ` · ${completenessLabel}` : ""}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {!confirmed && (review.redIssueCount > 0 || review.yellowIssueCount > 0) && (
            <div className={`mb-5 grid gap-3 ${review.redIssueCount > 0 && review.yellowIssueCount > 0 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
              {review.redIssueCount > 0 && <div className="rounded-lg border border-red/25 bg-red-light p-3 font-sans text-xs text-gray-700"><strong className="text-red">Red:</strong> must be corrected before analysis.</div>}
              {review.yellowIssueCount > 0 && <div className="rounded-lg border border-amber/30 bg-amber/10 p-3 font-sans text-xs text-gray-700"><strong className="text-amber-700">Yellow:</strong> check it; you can accept it with “Everything looks correct.”</div>}
            </div>
          )}

          <TotalsEditor review={review} disabled={busy || confirmed} onSave={fields => act({ action: "save_totals", fields })} />

          <div className="mt-6 mb-3 flex items-center justify-between gap-3">
            <div className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Invoice lines ({review.lines.length})</div>
            {!confirmed && <button onClick={() => setAdding(value => !value)} className="rounded-lg border border-blue/30 px-3 py-1.5 font-sans text-xs font-medium text-blue cursor-pointer">{adding ? "Cancel" : "+ Add missing line"}</button>}
          </div>

          {adding && (
            <NewLineEditor
              disabled={busy}
              onAdd={async fields => {
                const result = await act({ action: "add_line", fields });
                if (result) setAdding(false);
              }}
            />
          )}

          <div className="flex flex-col gap-3">
            {review.lines.map(line => (
              <ReviewLineEditor
                key={`${line.id}-${review.reviewVersion}`}
                line={line}
                disabled={busy || confirmed}
                onSave={fields => act({ action: "save_line", lineItemId: line.id, fields })}
                onExclude={() => act({ action: "exclude_line", lineItemId: line.id })}
              />
            ))}
          </div>

          {!confirmed && replacementTracking && (
            <ServiceReplacementConfirmation
              tracking={replacementTracking}
              drafts={replacementDrafts}
              onChange={setReplacementDrafts}
              disabled={busy}
            />
          )}
          {!confirmed && replacementError && (
            <div className="mt-6 rounded-xl border border-red/30 bg-red-light p-4 font-sans text-sm text-red">
              Service and replacement history could not be prepared: {replacementError}
            </div>
          )}

          {!confirmed && (
            <div className="mt-6 border-t border-gray-200 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="font-sans text-xs text-gray-600">
                {review.redIssueCount > 0 ? "Correct every red item to unlock analysis." : review.yellowIssueCount > 0 ? "Yellow items can be accepted if you checked them against the invoice." : "No unresolved problems found."}
              </div>
              <button
                disabled={busy || review.redIssueCount > 0 || (isPro && !!replacementError) || !replacementComplete}
                onClick={async () => {
                  const result = await act({
                    action: "confirm",
                    ...(replacementRequired ? { replacementResponses: toReplacementConfirmationInputs(replacementTracking.items, replacementDrafts) } : {}),
                  });
                  if (result) window.location.reload();
                }}
                className="rounded-lg bg-navy px-5 py-2.5 font-sans text-sm font-medium text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? "Saving…" : replacementRequired && !replacementComplete ? "Complete replacement history" : "Everything looks correct"}
              </button>
            </div>
          )}
          {error && <div className="mt-4 rounded-lg border border-red/30 bg-red-light p-3 font-sans text-sm text-red">{error}</div>}
        </div>
      )}
    </section>
  );
}

function TotalsEditor({ review, disabled, onSave }: { review: InvoiceReviewDTO; disabled: boolean; onSave: (fields: object) => Promise<unknown> }) {
  const totals = review.totals;
  const [values, setValues] = useState(() => ({
    grossChargesCents: centsInput(totals.grossChargesCents),
    creditsCents: centsInput(totals.creditsCents),
    pastBalanceCents: centsInput(totals.pastBalanceCents),
    lateFeesCents: centsInput(totals.lateFeesCents),
    taxesCents: centsInput(totals.taxesCents),
    totalDueCents: centsInput(totals.totalDueCents),
  }));
  const labels: Record<keyof typeof values, string> = {
    grossChargesCents: "Current charges",
    creditsCents: "Credits",
    pastBalanceCents: "Past balance",
    lateFeesCents: "Late fees",
    taxesCents: "Taxes",
    totalDueCents: "Total due",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-off-white/60 p-4">
      <div className="font-sans text-xs font-semibold text-navy mb-3">Totals printed on the invoice</div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {(Object.keys(values) as Array<keyof typeof values>).map(key => (
          <label key={key} className="font-sans text-[10px] uppercase tracking-wider text-gray-500">
            {labels[key]}
            <div className="mt-1 flex rounded-lg border border-gray-300 bg-white focus-within:border-blue">
              <span className="px-2 py-2 text-sm text-gray-400">$</span>
              <input type="number" step="0.01" value={values[key]} disabled={disabled} onChange={event => setValues(current => ({ ...current, [key]: event.target.value }))} inputMode="decimal" className="w-full min-w-0 rounded-r-lg py-2 pr-2 font-mono text-sm text-navy outline-none disabled:bg-gray-50" />
            </div>
          </label>
        ))}
      </div>
      {!disabled && <button onClick={() => void onSave(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, parseCents(value)])))} className="mt-3 rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-sans text-xs font-medium text-navy cursor-pointer">Save totals</button>}
      {totals.differenceCents != null && Math.abs(totals.differenceCents) > 100 && <div className="mt-3 font-sans text-xs text-red">These totals are off by ${(Math.abs(totals.differenceCents) / 100).toFixed(2)}.</div>}
    </div>
  );
}

function ReviewLineEditor({ line, disabled, onSave, onExclude }: { line: InvoiceReviewLine; disabled: boolean; onSave: (fields: EditableInvoiceLineFields) => Promise<unknown>; onExclude: () => Promise<unknown> }) {
  const [description, setDescription] = useState(line.description);
  const [quantity, setQuantity] = useState(numberInput(line.quantity));
  const [unitRate, setUnitRate] = useState(numberInput(line.unitRate));
  const [lineTotal, setLineTotal] = useState(centsInput(line.lineTotalCents));
  const [frequency, setFrequency] = useState(line.billingFrequency ?? "");
  const [lineType, setLineType] = useState<InvoiceLineType>(line.lineType);
  const [customerUnsure, setCustomerUnsure] = useState(line.identificationStatus === "customer_unsure");
  const severity = line.issues.some(item => item.severity === "red") ? "red" : line.issues.some(item => item.severity === "yellow") ? "yellow" : "none";
  const tone = severity === "red" ? "border-red/40 bg-red-light/40" : severity === "yellow" ? "border-amber/40 bg-amber/5" : customerUnsure ? "border-blue/30 bg-blue-pale/20" : "border-gray-200 bg-white";
  return (
    <div className={`rounded-xl border-2 p-4 ${tone}`}>
      <div className="grid gap-3 md:grid-cols-[minmax(220px,2fr)_100px_110px_120px_150px_130px]">
        <Field label="Description as printed"><input value={description} disabled={disabled} onChange={event => setDescription(event.target.value)} className={inputClass} /></Field>
        <Field label="Quantity"><input type="number" step="any" value={quantity} disabled={disabled} onChange={event => setQuantity(event.target.value)} inputMode="decimal" className={inputClass} /></Field>
        <Field label="Unit rate"><MoneyInput value={unitRate} onChange={setUnitRate} disabled={disabled} /></Field>
        <Field label="Line amount"><MoneyInput value={lineTotal} onChange={setLineTotal} disabled={disabled} /></Field>
        <Field label="Frequency"><select value={frequency} disabled={disabled} onChange={event => setFrequency(event.target.value)} className={inputClass}><option value="">Choose…</option>{FREQUENCIES.map(item => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Line type"><select value={lineType} disabled={disabled} onChange={event => setLineType(event.target.value as InvoiceLineType)} className={inputClass}>{INVOICE_LINE_TYPES.map(item => <option key={item} value={item}>{LINE_TYPE_LABEL[item]}</option>)}</select></Field>
      </div>
      <div className="mt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="font-sans text-xs text-gray-600">
          <span className="text-gray-500">Vendor code:</span> {line.vendorItemCode || "Not found"}
          {line.issues.map(item => <div key={item.code} className={item.severity === "red" ? "mt-1 text-red" : "mt-1 text-amber-700"}>{item.severity === "red" ? "●" : "◆"} {item.message}</div>)}
          {!disabled && (
            <label className="mt-3 flex max-w-xl cursor-pointer items-start gap-2 rounded-lg border border-blue/20 bg-white/80 p-3 text-navy">
              <input type="checkbox" checked={customerUnsure} onChange={event => setCustomerUnsure(event.target.checked)} className="mt-0.5 accent-blue" />
              <span>
                <strong className="block font-medium">I’m not sure what this charge is</strong>
                <span className="mt-0.5 block text-[11px] leading-4 text-gray-600">That’s okay. We’ll keep it in your totals, exclude it from product comparisons, and let you continue.</span>
              </span>
            </label>
          )}
          {disabled && line.identificationStatus === "customer_unsure" && (
            <div className="mt-2 rounded-lg bg-blue-pale/50 p-2 text-blue">Kept in totals as an unidentified charge; excluded from product comparisons.</div>
          )}
          {line.identificationStatus === "pending_review" && (
            <div className="mt-2 rounded-lg bg-blue-pale/50 p-2 text-blue">Your corrected invoice wording is saved. Product matching is pending internal review.</div>
          )}
        </div>
        {!disabled && <div className="flex gap-2"><button onClick={() => void onExclude()} className="rounded-lg px-3 py-1.5 font-sans text-xs text-gray-500 hover:text-red cursor-pointer">Remove line</button><button onClick={() => void onSave({ description, quantity: parseNullableNumber(quantity), unitRate: parseNullableNumber(unitRate), lineTotalCents: parseCents(lineTotal), billingFrequency: frequency || null, lineType, identificationStatus: customerUnsure ? "customer_unsure" : line.identificationStatus === "customer_unsure" ? "unclassified" : line.identificationStatus })} className="rounded-lg bg-navy px-3 py-1.5 font-sans text-xs font-medium text-white cursor-pointer">Save line</button></div>}
      </div>
    </div>
  );
}

function NewLineEditor({ disabled, onAdd }: { disabled: boolean; onAdd: (fields: EditableInvoiceLineFields) => Promise<void> }) {
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitRate, setUnitRate] = useState("");
  const [lineTotal, setLineTotal] = useState("");
  const [frequency, setFrequency] = useState("");
  const [lineType, setLineType] = useState<InvoiceLineType>("charge");
  const [customerUnsure, setCustomerUnsure] = useState(false);
  return (
    <div className="mb-3 rounded-xl border-2 border-dashed border-blue/40 bg-blue-pale/30 p-4">
      <div className="font-sans text-xs font-semibold text-navy mb-3">Add a line that was missed</div>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Description as printed"><input value={description} onChange={event => setDescription(event.target.value)} className={inputClass} /></Field>
        <Field label="Quantity"><input type="number" step="any" value={quantity} onChange={event => setQuantity(event.target.value)} inputMode="decimal" className={inputClass} /></Field>
        <Field label="Unit rate"><MoneyInput value={unitRate} onChange={setUnitRate} disabled={disabled} /></Field>
        <Field label="Line amount"><MoneyInput value={lineTotal} onChange={setLineTotal} disabled={disabled} /></Field>
        <Field label="Frequency"><select value={frequency} onChange={event => setFrequency(event.target.value)} className={inputClass}><option value="">Choose…</option>{FREQUENCIES.map(item => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Line type"><select value={lineType} onChange={event => setLineType(event.target.value as InvoiceLineType)} className={inputClass}>{INVOICE_LINE_TYPES.map(item => <option key={item} value={item}>{LINE_TYPE_LABEL[item]}</option>)}</select></Field>
      </div>
      <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-blue/20 bg-white p-3 font-sans text-xs text-navy">
        <input type="checkbox" checked={customerUnsure} onChange={event => setCustomerUnsure(event.target.checked)} className="mt-0.5 accent-blue" />
        <span><strong className="block font-medium">I’m not sure what this charge is</strong><span className="mt-0.5 block text-[11px] text-gray-600">It will remain in the invoice total but won’t be treated as a product.</span></span>
      </label>
      <button disabled={disabled || !description.trim()} onClick={() => void onAdd({ description, quantity: parseNullableNumber(quantity), unitRate: parseNullableNumber(unitRate), lineTotalCents: parseCents(lineTotal), billingFrequency: frequency || null, lineType, identificationStatus: customerUnsure ? "customer_unsure" : "unclassified" })} className="mt-3 rounded-lg bg-blue px-4 py-2 font-sans text-xs font-medium text-white cursor-pointer disabled:opacity-40">Add line</button>
    </div>
  );
}

const inputClass = "mt-1 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 font-sans text-sm text-navy outline-none focus:border-blue disabled:bg-gray-50";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="font-sans text-[10px] uppercase tracking-wider text-gray-500">{label}{children}</label>; }
function MoneyInput({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) { return <div className="mt-1 flex rounded-lg border border-gray-300 bg-white focus-within:border-blue"><span className="px-2 py-2 text-sm text-gray-400">$</span><input type="number" step="any" value={value} disabled={disabled} onChange={event => onChange(event.target.value)} inputMode="decimal" className="w-full min-w-0 rounded-r-lg py-2 pr-2 font-mono text-sm text-navy outline-none disabled:bg-gray-50" /></div>; }
function centsInput(value: number | null): string { return value == null ? "" : (value / 100).toFixed(2); }
function numberInput(value: number | null): string { return value == null ? "" : String(value); }
function parseNullableNumber(value: string): number | null { const trimmed = value.trim(); return trimmed === "" ? null : Number(trimmed); }
function parseCents(value: string): number | null { const number = parseNullableNumber(value); return number == null ? null : Math.round(number * 100); }
