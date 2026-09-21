// Offline fault injection against the actual invoice route, with mocked external boundaries.
import ts from 'typescript';
import { readFileSync, existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { PDFDocument } from 'pdf-lib';
import { fileURLToPath } from 'node:url';

const nativeRequire = createRequire(import.meta.url);
export async function runInvoiceFailureAudit() {
const doc = await PDFDocument.create(); doc.addPage(); doc.addPage();
const bytes = await doc.save();
const ai = {
  document_type: 'invoice', document_type_confidence: 1, page_count: 2,
  document_segments: [{ page_start: 1, page_end: 2, document_type: 'invoice', confidence: 1, completeness_status: 'complete' }],
  invoice_count: 1, invoices: [{ source_page_start: 1, source_page_end: 2, invoice_number: 'QA', gross_charges_cents: 5000, total_due_cents: 5000,
    line_items: [{ raw_label: 'QA towels', quantity: 10, unit_rate: 5, line_total_cents: 5000, billing_frequency: 'weekly' }] }],
};
const results = [];
for (const fault of ['none', 'multi_success', 'retry_success', 'primary_update', 'line_insert', 'sibling_insert', 'segment_insert', 'job_complete', 'publish_update', 'underreported_pages']) {
  const writes = []; const errors = []; const response = structuredClone(ai);
  if (fault === 'sibling_insert' || fault === 'multi_success') {
    response.document_segments = [1, 2].map(page => ({ page_start: page, page_end: page, document_type: 'invoice', confidence: 1, completeness_status: 'complete' }));
    response.invoices[0].source_page_end = 1;
    response.invoices.push({ ...structuredClone(response.invoices[0]), source_page_start: 2, source_page_end: 2, invoice_number: 'QA-2' });
    response.invoice_count = 2;
  }
  if (fault === 'underreported_pages') { response.page_count = 1; response.document_segments[0].page_end = 1; response.invoices[0].source_page_end = 1; }
  let invoiceCreates = 0;
  const admin = { from(table) {
    let operation = 'select'; let payload; let countOnly = false; let single = false;
    const query = new Proxy({}, { get(_, key) {
      if (key === 'then') return callback => {
        let data = null; let error = null;
        if (operation !== 'select') writes.push({ table, operation, payload });
        if (table === 'profiles') data = { plan: 'free', default_organization_id: 'qa-owner' };
        else if (fault === 'retry_success' && operation === 'select' && table === 'document_uploads') data = { id: 'saved-upload', current_classification_revision: 1, classification_status: 'needs_review' };
        else if (fault === 'retry_success' && operation === 'select' && table === 'invoice_analyses') data = [{ id: 'saved-invoice', sibling_index: 0, sibling_count: 1 }];
        else if (operation === 'insert') {
          if (table === 'invoice_analyses') invoiceCreates++;
          if (fault === 'line_insert' && table === 'invoice_line_items' || fault === 'sibling_insert' && table === 'invoice_analyses' && invoiceCreates > 1 || fault === 'segment_insert' && table === 'document_segments') error = { message: 'INJECTED write failure' };
          else data = single ? { id: `${table}-${invoiceCreates}`, current_classification_revision: 0 } : payload.map((row,index) => ({ ...row, id: `${table}-${index}`, segment_index: index }));
        } else if (operation === 'update') {
          if (table === 'invoice_analyses' && payload.invoice_number && fault === 'primary_update'
            || table === 'invoice_extraction_jobs' && payload.status === 'completed' && fault === 'job_complete'
            || table === 'invoice_analyses' && payload.status === 'completed' && fault === 'publish_update') error = { message: 'INJECTED update failure' };
          else data = single ? { id: `${table}-1` } : Array.from({ length: invoiceCreates }, (_,index) => ({ id: `${table}-${index+1}` }));
        }
        return Promise.resolve(callback({ data, error, ...(countOnly ? { count: 0 } : {}) }));
      };
      return (...args) => { if (['insert', 'update', 'delete', 'upsert'].includes(key)) { operation = key; payload = args[0]; } if (key === 'select') countOnly = Boolean(args[1]?.count); if (['single', 'maybeSingle'].includes(key)) single = true; return query; };
    } });
    return query;
  }, storage: { from: () => ({ download: async () => ({ data: new Blob([bytes], { type: 'application/pdf' }), error: null }) }) } };
  const stubs = {
    'next/server': { NextResponse: Response },
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'qa-owner' } } }) } }) },
    '@/lib/supabase/admin': { createAdminClient: () => admin },
    '@/lib/security/rate-limit': { checkRateLimit: async () => ({ allowed: true }) },
    '@/lib/db/products': { listProductsServer: async () => [] },
    '@/lib/db/vendors': { listVendorsServer: async () => [] },
    '@/lib/db/vendor-products': { listVendorProductsServer: async () => [], normalizeItemCode: x => x, vendorProductSourceKey: () => 'qa' },
  };
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const loadedModule = { exports: {} }; cache.set(file, loadedModule);
    const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const sandbox = { module: loadedModule, exports: loadedModule.exports, Buffer, Blob, Response, Request, URL, Set, Map, Date,
      process: { env: { ANTHROPIC_API_KEY: 'offline-placeholder' } },
      console: { log() {}, error: (...args) => errors.push(args.map(String).join(' ')) },
      fetch: async () => Response.json({ content: [{ text: JSON.stringify(response) }], usage: { input_tokens: 1, output_tokens: 1 }, stop_reason: 'end_turn' }),
      require(name) {
        if (name in stubs) return stubs[name];
        if (name === 'server-only') return {};
        if (name.startsWith('@/') || name.startsWith('.')) {
          let path = name.startsWith('@/') ? resolve(name.slice(2)) : resolve(dirname(file), name);
          if (!existsSync(path)) path += '.ts';
          return load(path);
        }
        return nativeRequire(name);
      },
    };
    vm.runInNewContext(source, sandbox, { filename: file }); return loadedModule.exports;
  }
  const route = load(resolve('app/api/invoices/extract/route.ts'));
  const result = await route.POST(new Request('http://localhost/api/invoices/extract', { method: 'POST', body: JSON.stringify({ storage_path: 'qa-owner/test.pdf' }) }));
  const body = await result.json();
  const success = fault === 'none' || fault === 'multi_success' || fault === 'retry_success';
  results.push({ fault, status: result.status, body, errors, writes, expected: success ? '200 success' : 'Non-success response', passed: success ? result.status === 200 && body.invoice_ids.length === response.invoices.length : result.status >= 400 });
}
return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
const results = await runInvoiceFailureAudit();
await mkdir('output/audit', { recursive: true });
await writeFile('output/audit/extraction-failure-results.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
process.exitCode = results.some(r => !r.passed) ? 1 : 0;
}
