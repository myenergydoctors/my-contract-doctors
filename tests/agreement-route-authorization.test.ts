import assert from "node:assert/strict";
import test from "node:test";
import { loadRoute } from "./helpers/load-route.mjs";

test("agreement routes authorize owner, paid entitlement, revocation, and safe account-list responses", async () => {
  let signedIn = true;
  const clause = { id: 'renewal', kind: 'auto_renewal', title: 'Renewal', risk: 'high', sourcePage: 1,
    contractText: 'Automatically renews annually.', plainEnglish: 'Another year.', recommendedAction: 'Review renewal.',
    noticeDays: 60, deadline: null, estimatedFinancialExposureCents: null, sourceVerified: true };
  const agreement = { id: 'a', user_id: 'owner', organization_id: null, vendor: 'QA', review_status: 'needs_review', status: 'completed',
    clauses: [clause, { ...clause, id: 'fee', kind: 'fee_rights', contractText: 'PRIVATE PAID QUOTE: a service fee applies.' }],
    raw_analysis: 'PRIVATE RAW RESPONSE', finding_count: 2, uploaded_at: '2026-09-21' };
  const profile = { id: 'owner', plan: 'free', business_name: 'QA' };
  const entitlement = { id: 'e', user_id: 'owner', agreement_analysis_id: 'a', active: false };
  const rows: Record<string, Array<Record<string, unknown>>> = {
    agreement_analyses: [agreement, { ...agreement, id: 'other', user_id: 'someone-else' }],
    profiles: [profile], agreement_entitlements: [entitlement], agreement_leads: [], invoice_analyses: [],
  };
  const admin = { from(table: string) {
    let selected = '*'; let single = false; const filters: Array<[string, unknown]> = [];
    const query = new Proxy({}, { get(_, key) {
      if (key === 'then') return (callback: (value: unknown) => unknown) => {
        const matching = (rows[table] ?? []).filter(row => filters.every(([column, value]) => row[column] === value));
        const projected = matching.map(row => selected === '*' ? row : Object.fromEntries(selected.split(',').map(column => [column, row[column]])));
        return Promise.resolve(callback({ data: single ? projected[0] ?? null : projected, error: null }));
      };
      return (...args: unknown[]) => { if (key === 'eq') filters.push([String(args[0]), args[1]]); if (key === 'select') selected = String(args[0]); if (key === 'maybeSingle') single = true; return query; };
    }});
    return query;
  }};
  const stubs = {
    'next/server': { NextResponse: Response },
    '@/lib/supabase/admin': { createAdminClient: () => admin },
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: signedIn ? { id: 'owner' } : null } }) }, rpc: async () => ({ data: true, error: null }) }) },
  };
  const detail = loadRoute('app/api/agreements/[id]/route.ts', stubs);
  const get = async (id = 'a') => detail.GET(new Request('http://localhost'), { params: Promise.resolve({ id }) });
  signedIn = false; assert.equal((await get()).status, 401); signedIn = true;
  assert.equal((await get('other')).status, 404);
  assert.equal((await (await get()).json()).agreement.findings.length, 0);
  agreement.review_status = 'confirmed';
  const free = await (await get()).json();
  assert.equal(free.agreement.findings.length, 1);
  assert.equal(free.agreement.findings[0].emailTemplate, null);
  assert.ok(!JSON.stringify(free).includes('PRIVATE'));
  profile.plan = 'pro';
  assert.equal((await (await get()).json()).agreement.findings.length, 2);
  profile.plan = 'free'; entitlement.active = true;
  assert.equal((await (await get()).json()).agreement.fullAccess, true);
  entitlement.active = false;
  assert.equal((await (await get()).json()).agreement.fullAccess, false);
  const listRoute = loadRoute('app/api/agreements/route.ts', stubs);
  const list = await (await listRoute.GET()).json();
  assert.equal(list.agreements.length, 1);
  assert.ok(!JSON.stringify(list).includes('PRIVATE'));
});
