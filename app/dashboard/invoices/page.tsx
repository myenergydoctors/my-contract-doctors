import Link from "next/link";
import { mockInvoices } from "@/lib/mock-data";

export default function InvoicesListPage() {
  const totalSavings = mockInvoices.reduce((s, i) => s + i.potentialAnnualSavings, 0);
  const totalFlagged = mockInvoices.reduce((s, i) => s + i.flaggedItemCount, 0);

  return (
    <div className="max-w-6xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <p className="font-sans font-light text-gray-500 leading-relaxed">
            Every invoice you've uploaded. Click any row for the full line-item breakdown.
          </p>
        </div>
        <Link
          href="/invoice"
          className="inline-flex items-center font-sans text-sm font-medium bg-teal text-white px-5 py-2.5 rounded-lg no-underline hover:opacity-90 transition-opacity self-start"
        >
          + Upload new invoice
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <SummaryCell label="Total identified savings" value={`$${totalSavings.toLocaleString()}/yr`} accent="teal" />
        <SummaryCell label="Flagged line items" value={totalFlagged.toString()} accent="red" />
        <SummaryCell label="Invoices analyzed" value={mockInvoices.length.toString()} accent="blue" />
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-6 px-6 py-3 border-b border-gray-200 bg-off-white font-sans text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          <div>Invoice</div>
          <div>Vendor</div>
          <div className="text-right">Monthly spend</div>
          <div className="text-right">Potential savings</div>
          <div />
        </div>
        {mockInvoices.map(inv => (
          <Link
            key={inv.id}
            href={`/dashboard/invoices/${inv.id}`}
            className="block px-6 py-4 border-b last:border-b-0 border-gray-100 hover:bg-blue-pale/30 transition-colors no-underline"
          >
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-3 md:gap-6 md:items-center">
              <div>
                <div className="font-sans text-xs text-gray-500 mb-1 md:hidden">{inv.vendor}</div>
                <div className="font-sans text-sm font-medium text-navy">{inv.invoiceNumber}</div>
                <div className="font-sans text-xs text-gray-500 mt-0.5">
                  {new Date(inv.uploadedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              </div>
              <div className="hidden md:block font-sans text-sm text-navy">{inv.vendor}</div>
              <div className="md:text-right">
                <div className="font-sans text-[10px] uppercase tracking-wider text-gray-500 md:hidden">Monthly spend</div>
                <div className="font-sans text-sm text-navy">${inv.totalSpend.toLocaleString()}</div>
              </div>
              <div className="md:text-right">
                <div className="font-sans text-[10px] uppercase tracking-wider text-gray-500 md:hidden">Potential savings</div>
                <div className="font-serif text-teal text-base">${inv.potentialAnnualSavings.toLocaleString()}/yr</div>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-red-light text-red px-2 py-1 rounded">
                  {inv.flaggedItemCount} flagged
                </span>
                <span className="hidden md:inline text-blue text-lg leading-none">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SummaryCell({ label, value, accent }: { label: string; value: string; accent: "teal" | "blue" | "red" }) {
  const cl = { teal: "text-teal", blue: "text-blue", red: "text-red" }[accent];
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="font-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-gray-500 mb-2">{label}</div>
      <div className={`font-serif text-2xl ${cl}`}>{value}</div>
    </div>
  );
}
