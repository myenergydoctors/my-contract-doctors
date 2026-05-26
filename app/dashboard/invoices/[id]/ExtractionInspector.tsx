"use client";
import { useEffect, useState } from "react";
import { getExtractionJobForInvoice, getInvoiceFileSignedUrl, type ExtractionJobForUI } from "@/lib/db/extraction-jobs";
import type { LineItemForUI } from "@/lib/db/line-items";

type Props = {
  invoiceId: string;
  filePath: string | null;
  lineItems: LineItemForUI[];
};

// Collapsible "what was actually extracted" panel for verifying AI output.
// Power-user / debugging affordance. Shows every field Claude returned plus
// links to view the original file + cost info.
export default function ExtractionInspector({ invoiceId, filePath, lineItems }: Props) {
  const [open, setOpen] = useState(false);
  const [job, setJob] = useState<ExtractionJobForUI | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    (async () => {
      const [j, url] = await Promise.all([
        getExtractionJobForInvoice(invoiceId),
        filePath ? getInvoiceFileSignedUrl(filePath) : Promise.resolve(null),
      ]);
      setJob(j);
      setFileUrl(url);
      setLoaded(true);
    })();
  }, [open, loaded, invoiceId, filePath]);

  return (
    <section className="mt-10 bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 bg-off-white hover:bg-gray-100 transition-colors cursor-pointer border-b border-gray-200"
      >
        <div className="flex items-center gap-3">
          <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-amber/20 text-amber-700 px-2 py-1 rounded">Inspect</span>
          <span className="font-sans text-sm font-medium text-navy">View extracted data + original file</span>
        </div>
        <span className="text-blue text-lg leading-none transition-transform" style={{ transform: open ? "rotate(45deg)" : "rotate(0)" }}>+</span>
      </button>

      {open && (
        <div className="p-6 flex flex-col gap-6">
          {!loaded && <div className="font-sans text-sm text-gray-500">Loading…</div>}

          {loaded && (
            <>
              {/* Original file */}
              {fileUrl && (
                <div className="bg-blue-pale/40 border border-blue/20 rounded-lg p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue mb-1">Original file</div>
                    <div className="font-sans text-sm text-navy">View the uploaded file to compare against what we extracted.</div>
                  </div>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="font-sans text-sm font-medium bg-navy text-white px-4 py-2 rounded-lg no-underline hover:opacity-90 transition-opacity whitespace-nowrap">
                    Open file →
                  </a>
                </div>
              )}

              {/* Line items table — every field, no shortcuts */}
              <div>
                <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  Line items as extracted ({lineItems.length})
                </div>
                {lineItems.length === 0 ? (
                  <div className="font-sans text-sm text-gray-500 italic">No line items were extracted.</div>
                ) : (
                  <div className="bg-off-white border border-gray-200 rounded-lg overflow-x-auto">
                    <table className="w-full min-w-[800px] text-xs">
                      <thead>
                        <tr className="bg-navy text-white">
                          <th className="text-left px-3 py-2 font-sans font-semibold uppercase tracking-wider">Raw label</th>
                          <th className="text-left px-3 py-2 font-sans font-semibold uppercase tracking-wider">Type</th>
                          <th className="text-left px-3 py-2 font-sans font-semibold uppercase tracking-wider">Mapped product</th>
                          <th className="text-left px-3 py-2 font-sans font-semibold uppercase tracking-wider">Vendor</th>
                          <th className="text-right px-3 py-2 font-sans font-semibold uppercase tracking-wider">Qty</th>
                          <th className="text-right px-3 py-2 font-sans font-semibold uppercase tracking-wider">Unit price</th>
                          <th className="text-left px-3 py-2 font-sans font-semibold uppercase tracking-wider">Freq</th>
                          <th className="text-right px-3 py-2 font-sans font-semibold uppercase tracking-wider">Annual</th>
                          <th className="text-left px-3 py-2 font-sans font-semibold uppercase tracking-wider">Flag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((li, i) => (
                          <tr key={li.id} className={`border-t border-gray-200 ${i % 2 === 0 ? "bg-white" : "bg-off-white"}`}>
                            <td className="px-3 py-2 font-sans text-navy">{li.rawLabel}</td>
                            <td className="px-3 py-2 font-sans">
                              <span className={`inline-block uppercase tracking-wider text-[10px] font-semibold px-2 py-0.5 rounded ${lineTypeColor(li.lineType)}`}>
                                {li.lineType.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-sans text-navy">
                              {li.productName ? (
                                <span title={li.productSlug || undefined}>{li.productName}</span>
                              ) : (
                                <span className="text-gray-400 italic">{li.lineType === "charge" ? "unmapped" : "—"}</span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-sans text-gray-700">{li.vendorName || <span className="text-gray-400 italic">—</span>}</td>
                            <td className="px-3 py-2 font-sans text-navy text-right">{li.quantity ?? "—"}</td>
                            <td className="px-3 py-2 font-sans text-navy text-right">{li.unitPriceCents != null ? `$${(li.unitPriceCents / 100).toFixed(2)}` : "—"}</td>
                            <td className="px-3 py-2 font-sans text-gray-700">{li.billingFrequency || "—"}</td>
                            <td className="px-3 py-2 font-sans text-navy text-right">{li.annualCostCents != null ? `$${(li.annualCostCents / 100).toLocaleString()}` : "—"}</td>
                            <td className="px-3 py-2 font-sans">
                              {li.flagged ? (
                                <span className={`uppercase tracking-wider text-[10px] font-semibold ${li.flagSeverity === "high" ? "text-red" : li.flagSeverity === "medium" ? "text-amber-600" : "text-blue"}`}>
                                  {li.flagSeverity || "flagged"}
                                </span>
                              ) : <span className="text-gray-400">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Extraction job stats */}
              {job && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label="Model"      value={job.aiModel || "—"} />
                  <Stat label="In / out"   value={`${job.aiTokensInput ?? "?"} / ${job.aiTokensOutput ?? "?"}`} />
                  <Stat label="AI cost"    value={job.aiCostCents != null ? `$${(job.aiCostCents / 100).toFixed(3)}` : "—"} />
                  <Stat label="Duration"   value={formatDuration(job.startedAt, job.completedAt)} />
                </div>
              )}

              {/* Raw AI response (collapsible) */}
              {job?.rawAiResponse && (
                <div>
                  <button onClick={() => setShowRaw(s => !s)} className="font-sans text-xs text-blue hover:text-navy bg-transparent border-none cursor-pointer">
                    {showRaw ? "Hide" : "Show"} raw AI JSON →
                  </button>
                  {showRaw && (
                    <pre className="mt-3 font-mono text-[11px] text-gray-700 bg-gray-100 border border-gray-200 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                      {JSON.stringify(job.rawAiResponse, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              {job?.errorMessage && (
                <div className="bg-red-light border border-red text-red font-sans text-sm rounded-lg p-3">
                  <strong>Extraction error:</strong> {job.errorMessage}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-off-white border border-gray-200 rounded-lg p-3">
      <div className="font-sans text-[9px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{label}</div>
      <div className="font-mono text-sm text-navy">{value}</div>
    </div>
  );
}

function lineTypeColor(type: string): string {
  switch (type) {
    case "charge": return "bg-blue-pale text-blue";
    case "credit": return "bg-teal-light text-teal";
    case "past_balance": return "bg-amber/20 text-amber-700";
    case "late_fee": return "bg-red-light text-red";
    case "discount": return "bg-teal-light text-teal";
    case "tax": return "bg-gray-200 text-gray-700";
    default: return "bg-gray-100 text-gray-500";
  }
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
