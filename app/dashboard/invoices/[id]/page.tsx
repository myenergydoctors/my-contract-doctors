"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { getInvoiceWithStatus, type InvoiceForUI } from "@/lib/db/invoices";
import { listLineItemsForInvoice, type LineItemForUI } from "@/lib/db/line-items";
import ExtractionInspector from "./ExtractionInspector";

const BENCHMARK_MIN_SAMPLE = 5; // need at least this many other customers in the same state before showing a benchmark

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<InvoiceForUI | null>(null);
  const [rawStatus, setRawStatus] = useState<string | null>(null);
  const [topFinding, setTopFinding] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<LineItemForUI[]>([]);
  const [loading, setLoading] = useState(true);

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
      } catch (e: any) {
        if (cancelled) return;
        setQueryError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl py-12 text-center">
        <div className="font-sans text-sm text-gray-500">Loading analysis…</div>
      </div>
    );
  }

  // Failed extraction — show the underlying reason rather than "not found"
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

  // Processing — still working on it
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

  const flagged = lineItems.filter(li => li.flagged);
  const clean = lineItems.filter(li => !li.flagged);

  return (
    <div className="max-w-5xl">

      {/* Back */}
      <Link href="/dashboard/invoices" className="inline-flex items-center font-sans text-sm text-blue hover:text-navy no-underline mb-4">
        ← Back to invoices
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
        <div>
          <div className="font-sans text-xs text-gray-500 mb-1">{invoice.vendor} · {invoice.invoiceNumber}</div>
          <h2 className="font-serif text-navy text-2xl md:text-3xl leading-tight mb-1">
            Invoice from {new Date(invoice.uploadedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </h2>
          {invoice.topFinding && (
            <p className="font-sans font-light text-gray-500 text-sm leading-relaxed">{invoice.topFinding}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button className="font-sans text-sm font-medium bg-white border border-gray-300 text-navy px-4 py-2 rounded-lg hover:bg-off-white transition-colors cursor-pointer">
            Download PDF
          </button>
          <button className="font-sans text-sm font-medium bg-navy text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
            Send dispute letter
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="font-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-gray-500 mb-2">Monthly spend</div>
          <div className="font-serif text-navy text-2xl">${invoice.totalSpend.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="font-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-gray-500 mb-2">Annual spend</div>
          <div className="font-serif text-navy text-2xl">${(invoice.totalSpend * 12).toLocaleString()}</div>
        </div>
        <div className="bg-teal-light border border-teal/30 rounded-xl p-4">
          <div className="font-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-teal mb-2">Potential annual savings</div>
          <div className="font-serif text-teal text-2xl">${invoice.potentialAnnualSavings.toLocaleString()}</div>
        </div>
      </div>

      {/* Benchmark availability notice — Phase 2C-2 will replace this with real data */}
      <div className="bg-blue-pale/40 border border-blue/20 rounded-xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue mb-1">Pricing benchmarks</div>
          <div className="font-sans text-sm text-navy">Coming soon — we'll show how each line item compares to other businesses in your state.</div>
          <div className="font-sans text-xs text-gray-500 mt-1">Requires at least {BENCHMARK_MIN_SAMPLE} customers in your area before we publish averages.</div>
        </div>
        <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-white border border-blue/30 text-blue px-2.5 py-1 rounded-full whitespace-nowrap">In development</span>
      </div>

      {/* Flagged items */}
      {flagged.length > 0 && (
        <section className="mb-8">
          <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-red mb-3">
            Worth a look ({flagged.length})
          </div>
          <div className="flex flex-col gap-3">
            {flagged.map(li => (
              <LineItemCard key={li.id} li={li} />
            ))}
          </div>
        </section>
      )}

      {/* Clean items */}
      {clean.length > 0 && (
        <section>
          <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-gray-500 mb-3">
            All other line items ({clean.length})
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {clean.map(li => (
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

      {flagged.length === 0 && clean.length === 0 && (
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
