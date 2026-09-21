import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("PostgreSQL migration blocks alternate content reads and entitlement writes while preserving owned invoice metadata", async () => {
  const db = new PGlite();
  try {
    // Representative pre-migration schema and broad legacy grants, with real PostgreSQL RLS.
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      grant usage on schema public to anon, authenticated, service_role;
      create table agreement_analyses (id text, user_id text, clauses jsonb, raw_analysis jsonb);
      create table agreement_entitlements (id text, user_id text, active boolean);
      create table document_uploads (id text, user_id text, raw_classification jsonb);
      create table invoice_leads (id text, user_id text);
      create table agreement_leads (id text, user_id text);
      create table agreement_invoice_links (agreement_analysis_id text, invoice_analysis_id text);
      create table invoice_extraction_jobs (id text, invoice_id text, status text, attempts int,
        started_at text,completed_at text,error_message text,ai_model text,ai_tokens_input int,
        ai_tokens_output int,ai_cost_cents int,created_at text,raw_ai_response jsonb);
      create table invoice_analyses (id text,user_id text,uploaded_at text,vendor text,invoice_number text,
        invoice_date text,status text,file_path text,total_spend_cents int,flagged_item_count int,
        period_start text,period_end text,gross_charges_cents int,credits_cents int,past_balance_cents int,
        late_fees_cents int,taxes_cents int,total_due_cents int,extracted_total_check_cents int,
        totals_reconciled boolean,parent_upload_id text,sibling_count int,sibling_index int,state text,
        raw_analysis jsonb,line_items jsonb,top_finding text,potential_annual_savings_cents int);
      grant all on all tables in schema public to authenticated;
      grant select (clauses), update (clauses) on agreement_analyses to authenticated;
      grant select (raw_ai_response) on invoice_extraction_jobs to public;
      alter table invoice_analyses enable row level security;
      create policy owner_only on invoice_analyses for select to authenticated
        using (user_id = current_setting('test.user_id', true));
      insert into invoice_analyses (id,user_id,total_due_cents,raw_analysis) values ('invoice-a','a',5000,'{"private":true}'),('invoice-b','b',9900,'{}');
      insert into agreement_analyses values ('agreement-a','a','[{"paid":true}]','{}');
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/20260921120000_protect_analysis_content.sql', import.meta.url), 'utf8'));
    // The migration is safely repeatable.
    await db.exec(await readFile(new URL('../supabase/migrations/20260921120000_protect_analysis_content.sql', import.meta.url), 'utf8'));
    const denied = async (sql: string) => assert.rejects(db.query(sql), (error: { code?: string }) => error.code === '42501');
    await db.exec("set role anon");
    await denied('select id from invoice_analyses');
    await denied('select raw_ai_response from invoice_extraction_jobs');
    await db.exec("reset role; set role authenticated; set test.user_id = 'a'");
    assert.deepEqual((await db.query('select id,total_due_cents from invoice_analyses')).rows, [{ id: 'invoice-a', total_due_cents: 5000 }]);
    for (const query of [
      'select clauses from agreement_analyses', 'select raw_analysis from agreement_analyses',
      'select raw_analysis from invoice_analyses', 'select raw_ai_response from invoice_extraction_jobs',
      'select raw_classification from document_uploads', 'select * from invoice_analyses',
      "update agreement_analyses set clauses = '[]'", "insert into agreement_entitlements values ('fake','a',true)",
    ]) await denied(query);
    await db.exec("set test.user_id = 'b'");
    assert.deepEqual((await db.query("select id from invoice_analyses where id = 'invoice-a'")).rows, []);
    // Paid users also use server endpoints; raw tables never become a public purchase API.
    await denied('select clauses from agreement_analyses');
    await db.exec('reset role; set role service_role');
    assert.equal((await db.query('select clauses from agreement_analyses')).rows.length, 1);
    assert.equal((await db.query('select id from invoice_analyses')).rows.length, 2);
    await db.exec("insert into invoice_leads values ('lead-a','a'); update invoice_leads set user_id='b' where id='lead-a'; delete from invoice_leads where id='lead-a';");
  } finally { await db.close(); }
});
