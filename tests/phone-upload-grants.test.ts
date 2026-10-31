import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("phone upload grants enable server handoff while browser roles remain denied", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      grant usage on schema public to anon, authenticated, service_role;
      create table invoice_upload_sessions (id text primary key, user_id text, status text);
      create table agreement_upload_sessions (like invoice_upload_sessions including all);
      alter table invoice_upload_sessions enable row level security;
      alter table agreement_upload_sessions enable row level security;
    `);
    const migration = await readFile(new URL('../supabase/migrations/20261031162908_phone_upload_server_grants.sql', import.meta.url), 'utf8');
    await db.exec(migration); await db.exec(migration);
    for (const table of ['invoice_upload_sessions', 'agreement_upload_sessions']) {
      await db.exec('set role service_role');
      await db.exec(`insert into ${table} values ('qa', 'owner', 'awaiting_upload'); update ${table} set status='uploaded' where id='qa'`);
      assert.equal((await db.query<{ status: string }>(`select status from ${table}`)).rows[0].status, 'uploaded');
      for (const role of ['anon', 'authenticated']) {
        await db.exec(`reset role; set role ${role}`);
        await assert.rejects(db.query(`select * from ${table}`), (error: { code?: string }) => error.code === '42501');
        await assert.rejects(db.query(`insert into ${table} values ('evil', 'other', 'uploaded')`), (error: { code?: string }) => error.code === '42501');
      }
      await db.exec('reset role');
    }
  } finally { await db.close(); }
});
