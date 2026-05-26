"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getInvoiceWithStatus, listInvoiceSiblings, type InvoiceForUI } from "@/lib/db/invoices";
import { listLineItemsForInvoice, type LineItemForUI, type LineType } from "@/lib/db/line-items";
import ExtractionInspector from "./ExtractionInspector";

const BENCHMARK_MIN_SAMPLE = 5;

const LINE_TYPE_LABEL: Record<LineType, string> = {
  charge: "Current-period charges",
  credit: "Credits / refunds",
  past_balance: "Past balance carried forward",
  late_fee: "Late fees / finance charges",
  discount: "Discounts",
  tax: "Taxes",
  other: "Other lines",
};

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [invoice, setInvoice] = useState<InvoiceForUI | null>(null);
  const [rawStatus, setRawStatus] = useState<string | null>(null);
  const [topFinding, setTopFinding] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<LineItemForUI[]>([]);
  const [siblings, setSiblings] = useState<InvoiceForUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [reprocessError, setReprocessError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [res, items] = await Promise.all([getInvoiceWithStatus(id), listLineItemsForInvoice(id)]);
        if (cancelled) return;
        setInvoice(res.invoice);
        setRawStatus(res.rawStatus);
        setTopFinding(res.topFinding);
        setQueryError(res.error);
        setLineItems(items);
        setFilePath(res.invoice?.filePath ?? null);

        // Load siblings if this invoice is part of a multi-invoice upload
        const parentId = res.invoice?.parentUploadId;
        if (parentId && (res.invoice?.siblingCount ?? 1) > 1) {
          const sibs = await listInvoiceSiblings(parentId);
          if (!cancelled) setSiblings(sibs);
        }
      } catch (e: any) {
        if (cancelled) return;
        setQueryError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function handleReprocess() {
    if (!invoice || reprocessing) return;
    if (!confirm("Re-run AI extraction on the original file? Existing analysis for this invoice will be replaced.")) return;
    setReprocessing(true);
    setReprocessError(null);
    try {
      const res = await fetch("/api/invoices/reprocess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoice.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReprocessError(data?.details?.message || data?.error || "Re-process failed");
        setReprocessing(false);
        return;
      }
      const newId = data.invoice_id;
      if (newId && newId !== invoice.id) {
        router.replace(`/dashboard/invoices/${newId}`);
      } else {
        window.location.reload();
      }
    } catch (e: any) {
      setReprocessError(e?.message || String(e));
      setReprocessing(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl py-12 text-center">
        <div className="font-sans text-sm text-gray-500">Loading analysis…</div>
      </div>
    );
  }

  if (rawStatus === "failed") {
    return (
      <div className="max-w-2xl py-12">
        <Link href="/dashboard/invoices" className="inline-flex items-center font-sans text-sm text-blue hover:text-navy no-underline mb-4">
          ← Back to invoices
        </Link>
        <div className="bg-white border-2 border-red/30 rounded-2xl p-8">
          <div className="w-12 h-12 rounded-xl bg-red-light flex items-center justify-center mb-4 text-2xl">⚠</div>
          <h2 className="font-serif text-navy text-2xl mb-3">Analysis didn't complete.</h2>
          <p className="font-sans text-gray-700 leading-relaxed mb-5">
            {topFinding || "Something went wrong while reading this file. Try uploading again, or use a clearer photo."}
          </p>
          <Link href="/invoice" className="inline-block font-sans text-sm font-medium bg-navy text-white px-5 py-2.5 rounded-lg no-underline hover:opacity-90">
            Try another upload →
          </Link>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-2xl py-12 text-center">
        <h2 className="font-serif text-navy text-2xl mb-3">Invoice not found.</h2>
        <p className="font-sans text-gray-500 mb-3">It may have been deleted, the link is wrong, or you don't have permission to view it.</p>
        {queryError && (
          <pre className="font-mono text-xs text-gray-400 bg-gray-100 inline-block px-3 py-2 rounded mb-6 max-w-full overflow-x-auto">{queryError}</pre>
        )}
        <div>
          <Link href="/dashboard/invoices" className="font-sans text-sm font-medium bg-navy text-white px-5 py-2.5 rounded-lg no-underline hover:opacity-90">
            ← Back to invoices
          </Link>
        </div>
      </div>
    );
  }

  if (rawStatus === "processing") {
    return (
      <div className="max-w-2xl py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-pale text-blue flex items-center justify-center mx-auto mb-5 text-2xl animate-pulse">⟳</div>
        <h2 className="font-serif text-navy text-2xl mb-3">Still analyzing…</h2>
        <p className="font-sans text-gray-500 mb-6">Refresh in a moment to see the result.</p>
        <Link href="/dashboard/invoices" className="font-sans text-sm text-blue hover:text-navy no-underline">← Back to invoices</Link>
      </div>
    );
  }

  // Group line items by type
  const grouped: Record<LineType, LineItemForUI[]> = {
    charge: [], credit: [], past_balance: [], late_fee: [], discount: [], tax: [], other: [],
  };
  for (const li of lineItems) grouped[li.lineType].push(li);

  const flaggedCharges = grouped.charge.filter(li => li.flagged);
  const cleanCharges = grouped.charge.filter(li => !li.flagged);
  const nonChargeBuckets: LineType[] = ["credit", "past_balance", "late_fee", "discount", "tax", "other"];
  const hasNonCharge = nonChargeBuckets.some(t => grouped[t].length > 0);

  return (
    <div className="max-w-5xl">

      <Link href="/dashboard/invoices" className="inline-flex items-center font-sans text-sm text-blue hover:text-navy no-underline mb-4">
        ← Back to invoices
      </Link>

      {/* Sibling navigator (multi-invoice files) */}
      {siblings.length > 1 && (
        <div className="mb-6 bg-blue-pale/40 border border-blue/20 rounded-xl p-4">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue mb-2">
            This file contained {siblings.length} invoices
          </div>
          <div className="flex flex-wrap gap-2">
            {siblings.map((s, i) => {
              const active = s.id === invoice.id;
              return (
                <Link
                  key={s.id}
                  href={`/dashboard/invoices/${s.id}`}
                  className={`font-sans text-xs px-3 py-1.5 rounded-lg no-underline transition-colors whitespace-nowrap ${active ? "bg-navy text-white" : "bg-white border border-blue/30 text-navy hover:bg-blue-pale"}`}
                >
                  #{i + 1} {s.invoiceNumber !== "—" ? s.invoiceNumber : `Invoice ${i + 1}`} · ${s.totalDue?.toLocaleString() ?? s.totalSpend.toLocaleString()}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
        <div>
          <div className="font-sans text-xs text-gray-500 mb-1">
            {invoice.vendor} · {invoice.invoiceNumber}
            {invoice.periodStart && invoice.periodEnd && (
              <> · billing period {fmtDate(invoice.periodStart)} – {fmtDate(invoice.periodEnd)}</>
            )}
          </div>
          <h2 className="font-serif text-navy text-2xl md:text-3xl leading-tight mb-1">
            {invoice.invoiceDate ? `Invoice from ${fmtDate(invoice.invoiceDate)}` : `Invoice uploaded ${fmtDate(invoice.uploadedAt)}`}
          </h2>
          {invoice.topFinding && (
            <p className="font-sans font-light text-gray-500 text-sm leading-relaxed">{invoice.topFinding}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleReprocess}
            disabled={reprocessing}
            className="font-sans text-sm font-medium bg-white border border-gray-300 text-navy px-4 py-2 rounded-lg hover:bg-off-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            {reprocessing ? "Re-processing…" : "Re-run extraction"}
          </button>
          <button className="font-sans text-sm font-medium bg-navy text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
            Send dispute letter
          </button>
        </div>
      </div>

      {reprocessError && (
        <div className="bg-red-light border border-red/30 rounded-lg p-3 mb-6 font-sans text-sm text-red">
          {reprocessError}
        </div>
      )}

      {/* Totals breakdown — the "open math" panel */}
      <TotalsPanel invoice={invoice} />

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Stat
          label="Current-period charges"
          value={invoice.grossCharges != null ? `$${invoice.grossCharges.toLocaleString()}` : `$${invoice.totalSpend.toLocaleString()}`}
          hint="Used for benchmarking"
        />
        <Stat
          label="Annualized charges"
          value={`$${(((invoice.grossCharges ?? invoice.totalSpend)) * 12).toLocaleString()}`}
          hint="What you'd pay over 12 months at this rate"
        />
        <Stat
          label="Potential annual savings"
          value={`$${invoice.potentialAnnualSavings.toLocaleString()}`}
          highlight
        />
      </div>

      {/* Benchmark notice */}
      <div className="bg-blue-pale/40 border border-blue/20 rounded-xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue mb-1">Pricing benchmarks</div>
          <div className="font-sans text-sm text-navy">Coming soon — we'll show how each line item compares to other businesses in your state.</div>
          <div className="font-sans text-xs text-gray-500 mt-1">Requires at least {BENCHMARK_MIN_SAMPLE} customers in your area before we publish averages.</div>
        </div>
        <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-white border border-blue/30 text-blue px-2.5 py-1 rounded-full whitespace-nowrap">In development</span>
      </div>

      {/* Flagged charges */}
      {flaggedCharges.length > 0 && (
        <section className="mb-8">
          <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-red mb-3">
            Worth a look ({flaggedCharges.length})
          </div>
          <div className="flex flex-col gap-3">
            {flaggedCharges.map(li => <LineItemCard key={li.id} li={li} />)}
          </div>
        </section>
      )}

      {/* Clean charges */}
      {cleanCharges.length > 0 && (
        <section className="mb-8">
          <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-gray-500 mb-3">
            All current-period charges ({cleanCharges.length})
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {cleanCharges.map(li => (
              <div key={li.id} className="flex justify-between items-center px-5 py-3 border-b last:border-b-0 border-gray-100">
                <div className="font-sans text-sm text-navy">
                  {li.productName || li.rawLabel}
                  {li.quantity && li.quantity > 1 ? <span className="text-gray-500"> × {li.quantity}</span> : null}
                </div>
                <div className="font-sans text-sm text-gray-500">{formatMonthly(li)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Non-charge buckets (credits, past balance, etc.) */}
      {hasNonCharge && (
        <section className="mb-8">
          <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-gray-500 mb-3">
            Other lines on this invoice
          </div>
          <div className="flex flex-col gap-3">
            {nonChargeBuckets.map(type => grouped[type].length === 0 ? null : (
              <div key={type} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-off-white px-5 py-2 font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  {LINE_TYPE_LABEL[type]} ({grouped[type].length})
                </div>
                {grouped[type].map(li => (
                  <div key={li.id} className="flex justify-between items-center px-5 py-2 border-b last:border-b-0 border-gray-100">
                    <div className="font-sans text-sm text-navy">{li.rawLabel}</div>
                    <div className="font-sans text-sm text-gray-500">
                      {li.unitPriceCents != null ? `$${(li.unitPriceCents / 100).toFixed(2)}` : "—"}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {flaggedCharges.length === 0 && cleanCharges.length === 0 && !hasNonCharge && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="font-sans text-sm text-gray-500">
            We couldn't extract line items from this file. Try uploading a clearer image, or contact us if the issue persists.
          </div>
        </div>
      )}

      <ExtractionInspector
        invoiceId={invoice.id}
        filePath={filePath}
        lineItems={lineItems}
      />
    </div>
  );
}

function TotalsPanel({ invoice }: { invoice: InvoiceForUI }) {
  // Don't show the math panel if we have nothing to show
  const hasAnyTotals = invoice.grossCharges != null || invoice.totalDue != null ||
                       invoice.credits > 0 || invoice.pastBalance > 0 || invoice.lateFees > 0 || invoice.taxes > 0;
  if (!hasAnyTotals) return null;

  const check = invoice.extractedTotalCheck;
  const totalDue = invoice.totalDue;
  const reconciled = invoice.totalsReconciled;
  const drift = check != null && totalDue != null ? check - totalDue : null;

  return (
    <section className="mb-8 bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="bg-off-white px-5 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-gray-500">
          Invoice totals — open math
        </div>
        {totalDue != null && (
          reconciled ? (
            <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-teal-light text-teal px-2 py-1 rounded-full">
              ✓ Reconciled
            </span>
          ) : drift != null ? (
            <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-amber/10 text-amber-700 px-2 py-1 rounded-full">
              ⚠ Off by ${Math.abs(drift).toFixed(2)}
            </span>
          ) : null
        )}
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          <MathRow label="Current-period charges" value={invoice.grossCharges} sign="+" />
          {invoice.credits > 0 && <MathRow label="Credits / refunds" value={invoice.credits} sign="−" tone="teal" />}
          {invoice.pastBalance > 0 && <MathRow label="Past balance carried forward" value={invoice.pastBalance} sign="+" tone="amber" />}
          {invoice.lateFees > 0 && <MathRow label="Late fees / finance charges" value={invoice.lateFees} sign="+" tone="red" />}
          {invoice.taxes > 0 && <MathRow label="Taxes" value={invoice.taxes} sign="+" />}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          {check != null && (
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm text-gray-500">Our computed total</span>
              <span className="font-mono text-sm text-navy">${check.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          {totalDue != null && (
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm font-semibold text-navy">Total due (per invoice)</span>
              <span className="font-serif text-navy text-xl">${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>
        {!reconciled && drift != null && (
          <div className="mt-4 bg-amber/10 border border-amber/30 rounded-lg p-3">
            <div className="font-sans text-xs text-amber-700">
              <strong>Math doesn't quite reconcile.</strong> Our totals are <strong>${Math.abs(drift).toFixed(2)} {drift > 0 ? "above" : "below"}</strong> the printed total due. Common causes: discounts not separately listed, rounding, or a line we mis-classified. Use "Re-run extraction" above or check the inspector below.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function MathRow({ label, value, sign, tone }: { label: string; value: number | null; sign: "+" | "−"; tone?: "teal" | "amber" | "red" }) {
  if (value == null) return null;
  const toneClass = tone === "teal" ? "text-teal" : tone === "amber" ? "text-amber-700" : tone === "red" ? "text-red" : "text-navy";
  return (
    <div className="flex items-center justify-between py-1">
      <span className="font-sans text-sm text-gray-700">{label}</span>
      <span className={`font-mono text-sm ${toneClass}`}>{sign} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>
  );
}

function Stat({ label, value, hint, highlight }: { label: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <div className={`${highlight ? "bg-teal-light border-teal/30" : "bg-white border-gray-200"} border rounded-xl p-4`}>
      <div className={`font-sans text-[10px] font-semibold tracking-[0.14em] uppercase mb-2 ${highlight ? "text-teal" : "text-gray-500"}`}>{label}</div>
      <div className={`font-serif text-2xl ${highlight ? "text-teal" : "text-navy"}`}>{value}</div>
      {hint && <div className="font-sans text-[10px] text-gray-500 mt-1">{hint}</div>}
    </div>
  );
}

function LineItemCard({ li }: { li: LineItemForUI }) {
  const sevColor = li.flagSeverity === "high" ? "border-l-red" : li.flagSeverity === "medium" ? "border-l-amber" : "border-l-blue";
  return (
    <div className={`bg-white border-l-4 ${sevColor} border border-gray-200 rounded-xl p-5`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
        <div>
          <div className="font-serif text-navy text-lg leading-tight">{li.productName || li.rawLabel}</div>
          <div className="font-sans text-xs text-gray-500 mt-0.5">
            {formatMonthly(li)}
            {li.productName && li.rawLabel !== li.productName ? ` · "${li.rawLabel}"` : null}
          </div>
        </div>
        {li.estimatedSavingsCents != null && li.estimatedSavingsCents > 0 && (
          <div className="bg-teal-light border border-teal/30 rounded-lg px-3 py-1.5 self-start">
            <span className="font-sans text-[10px] uppercase tracking-wider text-teal">Save</span>
            <span className="font-serif text-teal ml-2 text-base">${(li.estimatedSavingsCents / 100).toLocaleString()}/yr</span>
          </div>
        )}
      </div>
      {li.flagReason && (
        <div className="mb-2">
          <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500">Observation:&nbsp;</span>
          <span className="font-sans text-sm text-navy">{li.flagReason}</span>
        </div>
      )}
      {li.suggestedAction && (
        <div className="bg-teal-light/60 border border-teal/20 rounded-lg p-3">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-teal mb-1">Action</div>
          <div className="font-sans text-sm text-navy leading-relaxed">{li.suggestedAction}</div>
        </div>
      )}
    </div>
  );
}

function formatMonthly(li: LineItemForUI): string {
  if (li.annualCostCents != null && li.annualCostCents > 0) {
    return `$${(li.annualCostCents / 12 / 100).toFixed(2)}/mo`;
  }
  if (li.unitPriceCents != null && li.billingFrequency) {
    const monthly = monthlyFromUnit(li.unitPriceCents, li.quantity ?? 1, li.billingFrequency);
    if (monthly != null) return `$${monthly.toFixed(2)}/mo`;
  }
  return "—";
}

function monthlyFromUnit(unitCents: number, qty: number, freq: string): number | null {
  const total = (unitCents * qty) / 100;
  if (freq === "weekly") return total * 52 / 12;
  if (freq === "bi-weekly") return total * 26 / 12;
  if (freq === "monthly") return total;
  if (freq === "quarterly") return total / 3;
  if (freq === "annual") return total / 12;
  if (freq === "one-time" || freq === "per-event" || freq === "per-occurrence") return total;
  return null;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}
