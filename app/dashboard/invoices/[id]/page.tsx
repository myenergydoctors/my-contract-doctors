import Link from "next/link";
import { mockInvoices } from "@/lib/mock-data";
import { notFound } from "next/navigation";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = mockInvoices.find(i => i.id === id);
  if (!invoice) notFound();

  const flagged = invoice.lineItems.filter(li => li.flagged);
  const clean = invoice.lineItems.filter(li => !li.flagged);

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
          <p className="font-sans font-light text-gray-500 text-sm leading-relaxed">{invoice.topFinding}</p>
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

      {/* Flagged items */}
      {flagged.length > 0 && (
        <section className="mb-8">
          <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-red mb-3">
            Flagged items ({flagged.length})
          </div>
          <div className="flex flex-col gap-3">
            {flagged.map((li, i) => (
              <div key={i} className="bg-white border-l-4 border-l-red border border-gray-200 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                  <div>
                    <div className="font-serif text-navy text-lg leading-tight">{li.item}</div>
                    <div className="font-sans text-xs text-gray-500 mt-0.5">${li.monthlyCost.toLocaleString()}/mo</div>
                  </div>
                  {li.savings && (
                    <div className="bg-teal-light border border-teal/30 rounded-lg px-3 py-1.5 self-start">
                      <span className="font-sans text-[10px] uppercase tracking-wider text-teal">Save</span>
                      <span className="font-serif text-teal ml-2 text-base">${li.savings.toLocaleString()}/yr</span>
                    </div>
                  )}
                </div>
                {li.issue && (
                  <div className="mb-2">
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500">Issue:&nbsp;</span>
                    <span className="font-sans text-sm text-navy">{li.issue}</span>
                  </div>
                )}
                {li.suggestion && (
                  <div className="bg-teal-light/60 border border-teal/20 rounded-lg p-3">
                    <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-teal mb-1">Action</div>
                    <div className="font-sans text-sm text-navy leading-relaxed">{li.suggestion}</div>
                  </div>
                )}
              </div>
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
            {clean.map((li, i) => (
              <div key={i} className="flex justify-between items-center px-5 py-3 border-b last:border-b-0 border-gray-100">
                <div className="font-sans text-sm text-navy">{li.item}</div>
                <div className="font-sans text-sm text-gray-500">${li.monthlyCost.toLocaleString()}/mo</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
