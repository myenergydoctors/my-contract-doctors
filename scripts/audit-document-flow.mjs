// Opt-in integration audit: real local routes, AI provider, and configured Supabase.
// Creates only a disposable account and synthetic documents; never runs in npm test.
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (process.env.DOCUMENT_AUDIT_PROJECT !== new URL(url).hostname.split('.')[0]) throw new Error('Set DOCUMENT_AUDIT_PROJECT to the intended project before running.');
const origin = process.env.DOCUMENT_AUDIT_ORIGIN || 'http://localhost:3004';
const auditOrigin = new URL(origin);
const approvedProduction = origin === 'https://mycontractdoctors.com' && process.env.DOCUMENT_AUDIT_PROJECT === 'xrchncayomnwcnphrwhx';
if (!['localhost', '127.0.0.1'].includes(auditOrigin.hostname) && !approvedProduction) throw new Error('Audit routes must use localhost or the explicitly selected My Contract Doctors production project.');
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const jar = new Map();
const owner = createServerClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: {
  getAll: () => [...jar].map(([name, value]) => ({ name, value })),
  setAll: values => values.forEach(({ name, value }) => jar.set(name, value)),
} });
const run = randomUUID();
const results = { run, startedAt: new Date().toISOString(), scope: `${origin}; real configured Supabase and Anthropic; synthetic PDFs`, checks: [] };
function check(name, passed, detail = null) { results.checks.push({ name, passed, detail }); console.log(JSON.stringify({ name, passed, detail })); }
function requireOK(result) { if (result.error) throw new Error(result.error.message); return result.data; }
async function request(path, method = 'GET', body) {
  const response = await fetch(origin + path, { method, headers: { 'Content-Type': 'application/json', Cookie: [...jar].map(([k,v]) => `${k}=${v}`).join('; ') }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(300000) });
  const data = await response.json();
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(data)}`);
  return data;
}
async function pdf(pages) {
  const doc = await PDFDocument.create(); const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const lines of pages) { const page = doc.addPage([612,792]); lines.forEach((text, index) => page.drawText(text, { x:40,y:750-index*24,size:11,font })); }
  return doc.save();
}
const invoicePages = [
  ['SYNTHETIC QA DOCUMENT - NOT A REAL BILL', 'QA Linen Test Vendor', 'INVOICE QA-20260921-001', 'Invoice date: 2026-09-21', 'Bill to: QA Test Business, Portland, Maine 04101', 'Weekly service: 2026-09-14 through 2026-09-20', 'Item code | Description | Quantity | Unit rate | Line amount', 'T100 | Shop towel rental | 10 | $2.50 | $25.00', 'A200 | Apron rental | 4 | $5.00 | $20.00', 'Continued on page 2. Page 1 of 2.'],
  ['SYNTHETIC QA DOCUMENT - NOT A REAL BILL', 'QA Linen Test Vendor - INVOICE QA-20260921-001', 'Weekly billing. Page 2 of 2.', 'S300 | Service charge (flat weekly fee) | 1 | $5.00 | $5.00', 'Gross current charges: $50.00', 'Credits: $0.00', 'Past balance: $0.00', 'Late fees: $0.00', 'Taxes: $0.00', 'TOTAL DUE: $50.00'],
];
const agreementPages = [
  ['SYNTHETIC QA DOCUMENT - NOT A REAL CONTRACT', 'QA Linen Test Vendor - Service Agreement QA-AG-001', 'Customer: QA Test Business', 'Effective date: October 1, 2026. Expiration date: September 30, 2027.', 'This agreement renews automatically for successive one-year terms unless', 'either party gives written notice at least 60 days before expiration.', 'Notice must be delivered by certified mail to the vendor address.', 'Prices may increase once per year by no more than 3 percent, with', '30 days advance written notice to the customer.', 'Page 1 of 2.'],
  ['SYNTHETIC QA DOCUMENT - NOT A REAL CONTRACT', 'QA Linen Test Vendor - Service Agreement QA-AG-001', 'Early termination requires a fixed fee of $200.00.', 'No termination fee applies following an uncured material vendor breach.', 'No minimum billing applies. Only actual delivered quantities are billed.', 'No additional service fees are permitted without customer written approval.', 'Page 2 of 2.'],
];
let userId;
const paths = [];
const pendingMigration = process.env.DOCUMENT_AUDIT_PENDING_MIGRATION === 'true';
try {
  const password = randomUUID(); const email = `document-audit-${run}@example.invalid`;
  userId = requireOK(await admin.auth.admin.createUser({ email, password, email_confirm: true })).user.id;
  requireOK(await owner.auth.signInWithPassword({ email, password }));
  check('Disposable authenticated free account', true);
  async function upload(name, pages) {
    const bytes = await pdf(pages); const path = `${userId}/qa-${run}-${name}.pdf`; paths.push(path);
    requireOK(await owner.storage.from('invoices').upload(path, bytes, { contentType: 'application/pdf' }));
    return path;
  }
  const invoicePath = await upload('invoice', invoicePages);
  const invoiceResponse = await request('/api/invoices/extract', 'POST', { storage_path: invoicePath });
  check('Real invoice extraction returns one logical invoice across two pages', invoiceResponse.invoice_count === 1, { count: invoiceResponse.invoice_count });
  const invoiceId = invoiceResponse.invoice_id;
  let leadSaved = false;
  try {
    await request(`/api/invoices/${invoiceId}/lead`, 'POST', { stage: 'capture', email, businessName: 'QA Test Business', marketingConsent: false });
    leadSaved = true;
  } catch (error) {
    if (!pendingMigration || !error.message.includes('Your results email could not be saved')) throw error;
    check('Result-contact saving awaits server-role database grant', false, 'Known live database permission failure; migration not applied.');
  }
  async function confirmInvoice() {
    try { await request(`/api/invoices/${invoiceId}/review`, 'PATCH', { action: 'confirm' }); }
    catch (error) {
      if (!pendingMigration || !error.message.includes('result_profile_failed')) throw error;
      check('Result profiling awaits server-role database grant', false, 'Confirmation save is checked separately; profiling is blocked by unapplied database grant.');
    }
  }
  const invoice = requireOK(await admin.from('invoice_analyses').select('invoice_number,total_due_cents,gross_charges_cents,status,source_page_start,source_page_end').eq('id', invoiceId).single());
  check('Saved invoice number, totals, status and page coverage match fixture', invoice.invoice_number === 'QA-20260921-001' && invoice.total_due_cents === 5000 && invoice.gross_charges_cents === 5000 && invoice.status === 'completed' && invoice.source_page_start === 1 && invoice.source_page_end === 2, invoice);
  const lines = requireOK(await admin.from('invoice_line_items').select('id,raw_description,raw_quantity,raw_unit_rate,raw_line_total_cents,raw_billing_frequency').eq('invoice_id', invoiceId));
  check('All three invoice line amounts persist exactly', lines.length === 3 && JSON.stringify(lines.map(l => l.raw_line_total_cents).sort((a,b)=>a-b)) === JSON.stringify([500,2000,2500]), lines);
  const before = await request(`/api/invoices/${invoiceId}/review`);
  check('Invoice requires review before results', before.review.status !== 'confirmed', { status: before.review.status, redIssueCount: before.review.redIssueCount, issues: before.review.issues });
  if (before.review.redIssueCount === 0) {
    await confirmInvoice();
    const reopened = await request(`/api/invoices/${invoiceId}/review`);
    check('Invoice confirmation persists on a fresh read', reopened.review.status === 'confirmed', { totals: reopened.review.totals });
    const towel = lines.find(line => line.raw_description.toLowerCase().includes('towel'));
    await request(`/api/invoices/${invoiceId}/review`, 'PATCH', { action: 'save_line', lineItemId: towel.id, fields: { quantity: 12, lineTotalCents: 3000 } });
    await request(`/api/invoices/${invoiceId}/review`, 'PATCH', { action: 'save_totals', fields: { grossChargesCents: 5500, totalDueCents: 5500 } });
    await confirmInvoice();
    const corrected = await request(`/api/invoices/${invoiceId}/review`);
    check('Customer corrections persist and reconcile after reconfirmation', corrected.review.status === 'confirmed' && corrected.review.totals.totalDueCents === 5500 && corrected.review.totals.differenceCents === 0, corrected.review.totals);
    if (leadSaved) {
      const lead = requireOK(await admin.from('invoice_leads').select('finding_count,free_finding_kind,result_profiled_at').eq('invoice_analysis_id', invoiceId).single());
      check('Confirmed invoice finding metadata is saved to its lead', lead.finding_count > 0 && Boolean(lead.result_profiled_at), lead);
    }
  }
  const agreementPath = await upload('agreement', agreementPages);
  const agreementResponse = await request('/api/analyze-agreement', 'POST', { storage_path: agreementPath });
  const agreementId = agreementResponse.agreement_id;
  const stored = requireOK(await admin.from('agreement_analyses').select('page_count,vendor,expiration_date,renewal_notice_days,renewal_deadline,clauses,status').eq('id', agreementId).single());
  check('Agreement metadata and calculated 60-day notice deadline match fixture', stored.page_count === 2 && stored.expiration_date === '2027-09-30' && stored.renewal_notice_days === 60 && stored.renewal_deadline === '2027-08-01', { ...stored, clauses: undefined });
  const normalize = value => value.replace(/\s+/g, ' ').trim();
  check('Every extracted agreement quote occurs on its cited source page', stored.clauses.every(c => c.sourcePage && normalize(agreementPages[c.sourcePage-1].join(' ')).includes(normalize(c.contractText))), stored.clauses.map(c => ({ kind: c.kind, page: c.sourcePage, quote: c.contractText })));
  const preview = (await request(`/api/agreements/${agreementId}`)).agreement;
  check('Agreement findings hidden until confirmation', preview.findings.length === 0);
  await request(`/api/agreements/${agreementId}`, 'PATCH', { action: 'confirm' });
  const saved = (await request(`/api/agreements/${agreementId}`)).agreement;
  const list = await request('/api/agreements');
  check('Agreement list omits raw analysis and paid clause text', list.agreements.length === 1 && list.agreements[0].clauses.length === 0 && !JSON.stringify(list).includes('No minimum billing'), { count: list.agreements.length });
  check('Free agreement API exposes one finding and no paid email', saved.fullAccess === false && saved.findings.length === 1 && saved.findings[0].emailTemplate === null, { findingCount: saved.findingCount, visible: saved.findings.length, locked: saved.lockedFindingCount });
  const direct = await owner.from('agreement_analyses').select('clauses,raw_analysis').eq('id', agreementId).single();
  check('Direct customer database read protects paid agreement findings', Boolean(direct.error) || !direct.data || (direct.data.clauses?.length ?? 0) <= 1 && !direct.data.raw_analysis, { errorCode: direct.error?.code, exposedClauseCount: direct.data?.clauses?.length, rawAnalysisExposed: Boolean(direct.data?.raw_analysis) });
  check('Confirmed agreement finds the same-vendor saved invoice', saved.invoiceContext?.sameVendorInvoices === 1, saved.invoiceContext);
  // Exercise the existing Pro gate only on the disposable account. No billing event or purchase is simulated.
  requireOK(await admin.from('profiles').update({ plan: 'pro' }).eq('id', userId));
  const paid = (await request(`/api/agreements/${agreementId}`)).agreement;
  check('Pro agreement deliverable has every finding and quote-based email', paid.fullAccess && paid.findings.length === stored.clauses.length && paid.findings.every(f => f.emailTemplate?.body.includes(f.contractText.trim())), { visible: paid.findings.length, emails: paid.findings.filter(f => f.emailTemplate).length });
  const minimum = paid.findings.find(f => f.kind === 'minimum_commitment');
  check('No-minimum provision is treated as an existing protection', minimum?.assessment === 'protection' && minimum?.emailTemplate?.body.includes('not requesting that it be removed'));
  jar.clear();
  requireOK(await owner.auth.signInWithPassword({ email, password }));
  const restored = (await request(`/api/agreements/${agreementId}`)).agreement;
  check('Returning customer keeps saved agreement access', restored.fullAccess && restored.findings.length === paid.findings.length);
  requireOK(await admin.from('profiles').update({ plan: 'free' }).eq('id', userId));
  requireOK(await admin.from('agreement_entitlements').upsert({ user_id: userId, agreement_analysis_id: agreementId, source: 'one-time-purchase', active: true }, { onConflict: 'user_id,agreement_analysis_id' }));
  const oneTime = (await request(`/api/agreements/${agreementId}`)).agreement;
  check('One-time entitlement unlocks the saved deliverable on a free account', oneTime.fullAccess && oneTime.findings.length === paid.findings.length);
  requireOK(await admin.from('agreement_entitlements').update({ active: false }).eq('user_id', userId).eq('agreement_analysis_id', agreementId));
  const revoked = (await request(`/api/agreements/${agreementId}`)).agreement;
  check('Revoked one-time entitlement restores the free preview', !revoked.fullAccess && revoked.findings.length === 1 && revoked.findings[0].emailTemplate === null);
  for (const [table, column] of [['document_uploads', 'raw_classification'], ['invoice_extraction_jobs', 'raw_ai_response'], ['invoice_analyses', 'raw_analysis']]) {
    const blocked = await owner.from(table).select(column).limit(1);
    check(`Direct raw-content access is denied for ${table}`, blocked.error?.code === '42501', { code: blocked.error?.code });
  }
} catch (error) { results.error = error.message; check('Audit completed without an unexpected error', false, error.message); }
finally {
  if (paths.length) { const removed = await admin.storage.from('invoices').remove(paths); check('Synthetic storage files removed', !removed.error, removed.error?.message); }
  if (userId) {
    // Corrections reference the correcting user with RESTRICT; delete this test
    // account's invoice parents first so their correction rows cascade away.
    const removedInvoices = await admin.from('invoice_analyses').delete().eq('user_id', userId);
    check('Disposable invoice and correction records removed', !removedInvoices.error, removedInvoices.error?.message);
    const removed = await admin.auth.admin.deleteUser(userId); check('Disposable account removed', !removed.error, removed.error?.message);
  }
  results.completedAt = new Date().toISOString();
  await mkdir('output/audit', { recursive: true });
  await writeFile('output/audit/document-flow-results.json', JSON.stringify(results, null, 2));
}
process.exitCode = results.checks.some(c => !c.passed) ? 1 : 0;
