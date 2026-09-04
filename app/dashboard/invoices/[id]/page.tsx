"use client";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getInvoiceWithStatus, listInvoiceSiblings, type InvoiceForUI } from "@/lib/db/invoices";
import { listLineItemsForInvoice, type LineItemForUI, type LineType } from "@/lib/db/line-items";
import ExtractionInspector from "./ExtractionInspector";
import InvoiceReviewPanel from "./InvoiceReviewPanel";
import type { InvoiceReviewStatus } from "@/lib/invoice-review";
import {
  buildInvoiceFindings,
  periodsPerYear,
  selectFreeInvoiceFinding,
  selectFreeSavingsRecommendation,
  type InvoiceFinding,
  type FreeSavingsRecommendation,
} from "@/lib/invoice-recommendations";
import { useEffectivePlan } from "@/lib/use-effective-plan";

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
  const plan = useEffectivePlan();
  const hasFullInvoiceAccess = plan === "pro";

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
  const [reviewStatus, setReviewStatus] = useState<InvoiceReviewStatus | null>(null);

  const handleReviewStatusChange = useCallback((status: InvoiceReviewStatus | null) => {
    setReviewStatus(status);
    if (status === "confirmed") {
      void listLineItemsForInvoice(id).then(setLineItems);
    }
  }, [id]);

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
      } catch (e: unknown) {
        if (cancelled) return;
        setQueryError(e instanceof Error ? e.message : String(e));
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
    } catch (e: unknown) {
      setReprocessError(e instanceof Error ? e.message : String(e));
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
  const recommendationLines = lineItems.map(line => ({
    id: line.id,
    description: line.description,
    lineType: line.lineType,
    productSlug: line.productSlug,
    productName: line.productName,
    productCategory: line.productCategory,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    lineTotalCents: line.lineTotalCents,
    annualCostCents: line.annualCostCents,
    billingFrequency: line.billingFrequency,
    identificationStatus: line.identificationStatus,
  }));
  const freeRecommendation = selectFreeSavingsRecommendation(recommendationLines);
  const findings = buildInvoiceFindings(recommendationLines);
  const freeFinding = selectFreeInvoiceFinding(findings);
  const lockedFindingCount = Math.max(0, findings.length - (freeFinding ? 1 : 0));

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
          {hasFullInvoiceAccess && reviewStatus === "confirmed" && invoice.topFinding && (
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
        </div>
      </div>

      {reprocessError && (
        <div className="bg-red-light border border-red/30 rounded-lg p-3 mb-6 font-sans text-sm text-red">
          {reprocessError}
        </div>
      )}

      <InvoiceReviewPanel invoiceId={invoice.id} isPro={hasFullInvoiceAccess} onStatusChange={handleReviewStatusChange} />

      {reviewStatus !== "confirmed" ? (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-off-white p-8 text-center">
          <div className="font-serif text-xl text-navy mb-2">Analysis unlocks after invoice review</div>
          <div className="font-sans text-sm text-gray-600">Confirm the extracted invoice data above so pricing comparisons and savings estimates use the right information.</div>
        </div>
      ) : <>

      {/* Totals breakdown — the "open math" panel */}
      <TotalsPanel invoice={invoice} />

      <FindingSummary findingCount={findings.length} lockedFindingCount={lockedFindingCount} />

      {freeFinding?.kind === "floor_mat_purchase" && freeRecommendation ? (
        <FreeSavingsCard recommendation={freeRecommendation} invoiceId={invoice.id} />
      ) : freeFinding ? (
        <FreeFindingCard finding={freeFinding} />
      ) : (
        <NoSupportedFinding />
      )}

      {!hasFullInvoiceAccess && <FullAnalysisOffer invoiceId={invoice.id} lockedFindingCount={lockedFindingCount} />}

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Stat
          label="Current-period charges"
          value={invoice.grossCharges != null ? `$${invoice.grossCharges.toLocaleString()}` : `$${invoice.totalSpend.toLocaleString()}`}
          hint="Used for benchmarking"
        />
        <Stat
          label="Free opportunity"
          value={freeRecommendation ? money(freeRecommendation.firstYearSavingsCents) : freeFinding ? "1 shown" : "None found"}
          hint={freeRecommendation ? "Estimated first-year savings" : freeFinding ? "A review priority, not claimed savings" : "No supported finding from confirmed data"}
        />
        <Stat
          label="Estimated payback"
          value={freeRecommendation ? `${freeRecommendation.paybackWeeks} wk${freeRecommendation.paybackWeeks === 1 ? "" : "s"}` : "—"}
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

      {hasFullInvoiceAccess && <>
      <PaidFindings findings={findings.filter(finding => finding.id !== freeFinding?.id)} />
      {/* Full analysis */}
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
                  {li.productName || li.description}
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
      </>}
      </>}
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

function FreeSavingsCard({ recommendation, invoiceId }: { recommendation: FreeSavingsRecommendation; invoiceId: string }) {
  const frequencyLabel = recommendation.billingFrequency.replace("bi-weekly", "every other week");
  return (
    <section className="mb-8 overflow-hidden rounded-2xl border-2 border-teal/30 bg-white">
      <div className="bg-teal-light px-5 py-4 sm:px-6">
        <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-teal">Your free savings opportunity</div>
        <h3 className="mt-1 font-serif text-2xl text-navy">Consider owning these mats instead of renting them</h3>
        <p className="mt-2 font-sans text-sm leading-6 text-gray-700">
          Your confirmed invoice shows <strong>{recommendation.quantity} {recommendation.itemName}</strong> costing <strong>{money(recommendation.currentPeriodCostCents)} {frequencyLabel}</strong>.
        </p>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SavingsMath label="Keep renting" value={`${money(recommendation.annualRentalCostCents)}/year`} detail={`${money(recommendation.currentPeriodCostCents)} × ${recommendation.periodsPerYear} bills`} />
          <SavingsMath label="Buy once" value={money(recommendation.purchaseCostCents)} detail={`${recommendation.quantity} × ${money(recommendation.purchaseUnitPriceCents)} preview price`} />
          <SavingsMath label="Estimated year-one savings" value={money(recommendation.firstYearSavingsCents)} detail={`Purchase pays back in about ${recommendation.paybackWeeks} week${recommendation.paybackWeeks === 1 ? "" : "s"}`} highlight />
        </div>

        <div className="mt-5 rounded-xl border border-gray-200 bg-off-white p-4 font-sans text-xs leading-5 text-gray-600">
          From year two forward, the avoided rental charge would be about <strong className="text-navy">{money(recommendation.laterYearSavingsCents)} per year</strong>. This estimate assumes the rental line can be removed under your agreement. It does not include cleaning, maintenance, shipping, tax, or replacement costs.
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href={`/checkout/floor-mat?quantity=${recommendation.quantity}&invoice=${encodeURIComponent(invoiceId)}`}
            className="rounded-lg bg-navy px-5 py-3 text-center font-sans text-sm font-medium text-white no-underline hover:opacity-90"
          >
            Preview buying {recommendation.quantity} mat{recommendation.quantity === 1 ? "" : "s"} →
          </Link>
          <div className="font-sans text-xs leading-5 text-gray-500">Mock $75 drop-ship offer for testing only. No payment or order is placed.</div>
        </div>
      </div>
    </section>
  );
}

function FindingSummary({ findingCount, lockedFindingCount }: { findingCount: number; lockedFindingCount: number }) {
  const label = findingCount === 1 ? "1 area" : `${findingCount} areas`;
  return (
    <section className="mb-6 rounded-2xl border border-blue/25 bg-blue-pale/35 p-5 sm:p-6">
      <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-blue">Confirmed invoice review</div>
      <h3 className="mt-1 font-serif text-2xl text-navy">
        {findingCount > 0 ? `We found ${label} worth reviewing.` : "We did not find a supported review area in these confirmed lines."}
      </h3>
      {findingCount > 0 && (
        <p className="mt-2 font-sans text-sm leading-6 text-gray-600">
          Your first finding is shown below. {lockedFindingCount > 0 ? `${lockedFindingCount} additional ${lockedFindingCount === 1 ? "finding is" : "findings are"} included in the full analysis.` : "There are no additional findings hidden from you."}
        </p>
      )}
    </section>
  );
}

function FreeFindingCard({ finding }: { finding: InvoiceFinding }) {
  return (
    <section className="mb-8 rounded-2xl border-2 border-teal/30 bg-white p-5 sm:p-6">
      <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-teal">Your free invoice finding</div>
      <h3 className="mt-1 font-serif text-2xl text-navy">{finding.title}</h3>
      <p className="mt-2 font-sans text-sm leading-6 text-gray-700">{finding.summary}</p>
      <div className="mt-4 rounded-xl border border-gray-200 bg-off-white p-4">
        <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500">Recommended next step</div>
        <p className="mt-1 font-sans text-sm leading-6 text-navy">{finding.action}</p>
      </div>
      {finding.annualImpactCents != null && (
        <p className="mt-3 font-sans text-xs text-gray-500">Annualized amount reviewed: <strong className="text-navy">{money(finding.annualImpactCents)}</strong>. This is not a promised savings amount.</p>
      )}
    </section>
  );
}

function NoSupportedFinding() {
  return (
    <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
      <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Your free invoice finding</div>
      <h3 className="mt-1 font-serif text-xl text-navy">There is not enough confirmed information for a responsible recommendation.</h3>
      <p className="mt-2 font-sans text-sm leading-6 text-gray-600">We will not invent a product recommendation or savings number just to fill this space. You can revise the extracted lines and confirm again if something was missed.</p>
    </section>
  );
}

function PaidFindings({ findings }: { findings: InvoiceFinding[] }) {
  if (findings.length === 0) return null;
  return (
    <section className="mb-8">
      <div className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">Additional findings ({findings.length})</div>
      <div className="flex flex-col gap-3">
        {findings.map(finding => (
          <div key={finding.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <h4 className="font-serif text-lg text-navy">{finding.title}</h4>
            <p className="mt-1 font-sans text-sm leading-6 text-gray-600">{finding.summary}</p>
            <p className="mt-2 font-sans text-sm leading-6 text-navy"><strong>Next step:</strong> {finding.action}</p>
            {finding.annualImpactCents != null && <p className="mt-2 font-sans text-xs text-gray-500">{finding.isSavingsEstimate ? "Estimated first-year savings" : "Annualized amount reviewed"}: {money(finding.annualImpactCents)}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function FullAnalysisOffer({ invoiceId, lockedFindingCount }: { invoiceId: string; lockedFindingCount: number }) {
  const hasLockedFindings = lockedFindingCount > 0;
  return (
    <section className="mb-8 rounded-2xl bg-navy p-6 text-white sm:p-8">
      <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-light">
        {hasLockedFindings ? `${lockedFindingCount} additional ${lockedFindingCount === 1 ? "finding" : "findings"}` : "Continue with your agreement"}
      </div>
      <h3 className="mt-2 max-w-2xl font-serif text-2xl leading-tight">
        {hasLockedFindings ? "Unlock the rest of this confirmed invoice review." : "Your invoice may be clear. Your agreement can still reveal costly terms."}
      </h3>
      <p className="mt-3 max-w-2xl font-sans text-sm leading-6 text-white/75">
        {hasLockedFindings
          ? "The free finding stays visible. Pay for this invoice once, or choose Pro for ongoing invoice and agreement reviews."
          : "Pro includes up to five new invoice analyses each month and one agreement analysis credit per quarter, so you can review the contract behind these charges and keep monitoring future invoices."}
      </p>
      {hasLockedFindings && <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {Array.from({ length: Math.min(lockedFindingCount, 4) }, (_, index) => (
            <div key={index} className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 font-sans text-sm text-white/70">🔒 Finding {index + 2} and its next step</div>
          ))}
          {lockedFindingCount > 4 && <div className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 font-sans text-sm text-white/70">+ {lockedFindingCount - 4} more</div>}
      </div>}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href={`/checkout/pro?invoice=${encodeURIComponent(invoiceId)}`} className="rounded-lg bg-teal px-5 py-3 text-center font-sans text-sm font-semibold text-white no-underline hover:opacity-90">
          {hasLockedFindings ? "Unlock everything with Pro — $29/month →" : "Continue with Pro — $29/month →"}
        </Link>
        {hasLockedFindings && <Link href={`/checkout/invoice-analysis?invoice=${encodeURIComponent(invoiceId)}`} className="rounded-lg border border-white/30 bg-white/10 px-5 py-3 text-center font-sans text-sm font-medium text-white no-underline hover:bg-white/15">
          One invoice — $49 one time
        </Link>}
      </div>
      <div className="mt-3 font-sans text-[11px] leading-5 text-white/60">Checkout is currently a preview. It will not charge you, activate Pro, or unlock this invoice until secure payment fulfillment is connected.</div>
    </section>
  );
}

function SavingsMath({ label, value, detail, highlight }: { label: string; value: string; detail: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-teal/30 bg-teal-light" : "border-gray-200 bg-white"}`}>
      <div className={`font-sans text-[10px] font-semibold uppercase tracking-wider ${highlight ? "text-teal" : "text-gray-500"}`}>{label}</div>
      <div className={`mt-1 font-serif text-2xl ${highlight ? "text-teal" : "text-navy"}`}>{value}</div>
      <div className="mt-1 font-sans text-[11px] leading-4 text-gray-500">{detail}</div>
    </div>
  );
}

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
          <div className="font-serif text-navy text-lg leading-tight">{li.productName || li.description}</div>
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
  if (li.lineTotalCents != null && li.billingFrequency) {
    const periods = periodsPerYear(li.billingFrequency);
    if (periods != null) return `$${(li.lineTotalCents * periods / 12 / 100).toFixed(2)}/mo`;
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
