import assert from "node:assert/strict";
import test from "node:test";
import { loadRoute } from "./helpers/load-route.mjs";

test("confirmation profiles only confirmed lines and surfaces failed metadata writes", async () => {
  let failWrite = false;
  let stored: Record<string, unknown> | undefined;
  const lines = [
    { id: 'towels', invoice_id: 'invoice', raw_label: 'Towel rental', confirmed_description: 'Towel rental',
      review_status: 'confirmed', line_type: 'charge', confirmed_line_type: 'charge', confirmed_quantity: 12,
      confirmed_unit_rate: 2.5, confirmed_line_total_cents: 3000, confirmed_billing_frequency: 'weekly', identification_status: 'matched' },
    { id: 'excluded-fee', invoice_id: 'invoice', raw_label: 'Service fee', review_status: 'excluded', line_type: 'charge',
      raw_line_total_cents: 99900, billing_frequency: 'weekly', identification_status: 'matched' },
  ];
  class ReviewError extends Error {
    status: number; code: string;
    constructor(message: string, status: number, code: string) { super(message); this.status = status; this.code = code; }
  }
  const admin = { from(table: string) {
    const filters: Array<[string, unknown]> = [];
    let values: Record<string, unknown> | undefined;
    const query = new Proxy({}, { get(_, key) {
      if (key === 'then') return (callback: (value: unknown) => unknown) => {
        if (table === 'profiles') return Promise.resolve(callback({ data: { plan: 'free' }, error: null }));
        if (table === 'invoice_line_items') return Promise.resolve(callback({ data: lines.filter(row => filters.every(([column, value]) => row[column] === value)), error: null }));
        if (table === 'invoice_leads') { if (!failWrite) stored = values; return Promise.resolve(callback({ error: failWrite ? { message: 'injected' } : null })); }
        throw new Error(`Unexpected table: ${table}`);
      };
      return (...args: unknown[]) => { if (key === 'eq') filters.push([String(args[0]), args[1]]); if (key === 'update') values = args[0] as Record<string, unknown>; return query; };
    }});
    return query;
  }};
  const route = loadRoute('app/api/invoices/[id]/review/route.ts', {
    'next/server': { NextResponse: Response },
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) } }) },
    '@/lib/supabase/admin': { createAdminClient: () => admin },
    '@/lib/db/invoice-review-server': { InvoiceReviewError: ReviewError, confirmInvoiceReview: async () => ({ status: 'confirmed' }) },
    '@/lib/db/service-replacement-history-server': { ServiceReplacementError: class extends Error {} },
  });
  const confirm = () => route.PATCH(new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ action: 'confirm' }) }), { params: Promise.resolve({ id: 'invoice' }) });
  assert.equal((await confirm()).status, 200);
  assert.equal(stored.finding_count, 1);
  assert.equal(stored.free_finding_kind, 'largest_recurring_charge');
  failWrite = true;
  const failed = await confirm();
  assert.equal(failed.status, 503);
  assert.equal((await failed.json()).code, 'result_profile_failed');
});
