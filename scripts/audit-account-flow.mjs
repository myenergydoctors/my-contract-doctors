// Opt-in real account/onboarding/phone-handoff verification; disposable users only.
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { randomUUID, createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { removeDisposableAccount } from './lib/qa-cleanup.mjs';
nextEnv.loadEnvConfig(process.cwd());
const project = 'xrchncayomnwcnphrwhx';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const origin = process.env.ACCOUNT_AUDIT_ORIGIN || 'http://localhost:3004';
if (process.env.ACCOUNT_AUDIT_PROJECT !== project || new URL(url).hostname !== `${project}.supabase.co`
  || !['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Explicitly select the allowed project and localhost origin.');
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const jar = new Map();
const owner = createServerClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: {
  getAll: () => [...jar].map(([name, value]) => ({ name, value })),
  setAll: values => values.forEach(({ name, value }) => jar.set(name, value)),
} });
const run = randomUUID(), email = `account-flow-${run}@example.invalid`;
const password = randomUUID(), nextPassword = randomUUID();
const results = { run, origin, startedAt: new Date().toISOString(), checks: [] };
let userId; const files = [];
function ok(result) { if (result.error) throw new Error(result.error.message); return result.data; }
function check(name, passed) { results.checks.push({ name, passed }); console.log(JSON.stringify({ name, passed })); if (!passed) throw new Error(name); }
async function request(path, method = 'GET', body, extraHeaders = {}, authenticated = true) {
  const response = await fetch(origin + path, { method, headers: {
    Origin: origin, ...(authenticated ? { Cookie: [...jar].map(([k,v]) => `${k}=${v}`).join('; ') } : {}),
    ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...extraHeaders,
  }, ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}), signal: AbortSignal.timeout(60000) });
  return { status: response.status, data: await response.json() };
}
try {
  userId = ok(await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: 'Process', last_name: 'QA', business_name: 'Synthetic QA Business' } })).user.id;
  ok(await owner.auth.signInWithPassword({ email, password }));
  check('Anonymous onboarding is rejected', (await request('/api/account/onboarding', 'GET', null, {}, false)).status === 401);
  check('Onboarding prefills the real profile', (await request('/api/account/onboarding')).data.business === 'Synthetic QA Business');
  const draft = { business: 'Saved QA Business', industry: 'Healthcare', vendor: 'Cintas', monthlySpend: 'Under $500', step: 3, completed: false };
  check('Onboarding progress saves', (await request('/api/account/onboarding', 'POST', draft)).status === 200);
  await owner.auth.signOut(); jar.clear(); ok(await owner.auth.signInWithPassword({ email, password }));
  const resumed = (await request('/api/account/onboarding')).data;
  check('Fresh sign-in restores all onboarding answers and step', resumed.business === draft.business && resumed.industry === draft.industry && resumed.vendor === draft.vendor && resumed.monthlySpend === draft.monthlySpend && resumed.step === 3 && !resumed.completed);
  check('Onboarding completion persists', (await request('/api/account/onboarding', 'POST', { ...draft, step: 4, completed: true })).status === 200 && (await request('/api/account/onboarding')).data.completed);
  check('Cross-site profile writes are rejected', (await request('/api/account/onboarding', 'POST', draft, { Origin: 'https://attacker.invalid' })).status === 403);
  check('Incorrect current password cannot change credentials', (await request('/api/account/change-password', 'POST', { currentPassword: 'wrong-password', newPassword: nextPassword })).status === 403);
  check('Correct current password permits password change', (await request('/api/account/change-password', 'POST', { currentPassword: password, newPassword: nextPassword })).status === 200);
  const probe = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  check('Old password stops working', Boolean((await probe.auth.signInWithPassword({ email, password })).error));
  ok(await owner.auth.signInWithPassword({ email, password: nextPassword }));
  check('New password restores saved account', (await request('/api/account/onboarding')).data.completed === true);
  check('Password reset without recovery proof is rejected', (await request('/api/account/reset-password', 'POST', { password: randomUUID() })).status === 403);
  for (const kind of ['invoices', 'agreements']) {
    const base = `/api/${kind}/upload-sessions`;
    const created = await request(base, 'POST', {});
    check(`${kind}: desktop creates a phone upload session`, created.status === 200 && Boolean(created.data.token));
    const { sessionId, token } = created.data;
    check(`${kind}: wrong phone token is rejected`, (await request(`${base}/${sessionId}/file`, 'POST', new FormData(), { 'x-upload-token': 'wrong' }, false)).status === 404);
    const form = new FormData(); form.set('file', new Blob(['Synthetic QA phone upload'], { type: 'application/pdf' }), 'qa-phone.pdf');
    check(`${kind}: phone uploads without desktop cookies`, (await request(`${base}/${sessionId}/file`, 'POST', form, { 'x-upload-token': token }, false)).status === 200);
    const polled = await request(`${base}/${sessionId}`, 'GET', null, { 'x-upload-token': token });
    if (polled.data.file?.storagePath) files.push(polled.data.file.storagePath);
    check(`${kind}: desktop receives the saved phone file`, polled.data.status === 'uploaded' && Boolean(polled.data.file?.storagePath?.startsWith(`${userId}/`)));
    check(`${kind}: upload link cannot be reused`, (await request(`${base}/${sessionId}/file`, 'POST', form, { 'x-upload-token': token }, false)).status === 409);
    check(`${kind}: anonymous desktop polling is denied`, (await request(`${base}/${sessionId}`, 'GET', null, { 'x-upload-token': token }, false)).status === 401);
    const expiring = await request(base, 'POST', {});
    check(`${kind}: expiry test session starts`, expiring.status === 200);
    ok(await admin.from(`${kind === 'invoices' ? 'invoice' : 'agreement'}_upload_sessions`).update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq('id', expiring.data.sessionId).eq('user_id', userId));
    check(`${kind}: expired phone link rejects a file`, (await request(`${base}/${expiring.data.sessionId}/file`, 'POST', form, { 'x-upload-token': expiring.data.token }, false)).status === 410);
    check(`${kind}: desktop sees the expired state`, (await request(`${base}/${expiring.data.sessionId}`, 'GET', null, { 'x-upload-token': expiring.data.token })).data.status === 'expired');
  }
  const token = randomUUID().replaceAll('-', '') + randomUUID().replaceAll('-', '');
  ok(await admin.from('account_deactivation_challenges').upsert({ user_id: userId, token_hash: createHash('sha256').update(token).digest('hex'), expires_at: new Date(Date.now() + 600000).toISOString(), consumed_at: null }));
  check('Deactivation requires the correct confirmation', (await request('/api/account/deactivate', 'POST', { token: '0'.repeat(64) })).status === 409);
  check('Confirmed deactivation completes', (await request('/api/account/deactivate', 'POST', { token })).status === 200);
  const retained = ok(await admin.from('profiles').select('deactivated_at,business_name').eq('id', userId).single());
  check('Deactivation retains the account data', Boolean(retained.deactivated_at) && retained.business_name === draft.business);
  check('Deactivated account cannot sign in again', Boolean((await probe.auth.signInWithPassword({ email, password: nextPassword })).error));
} catch (error) { results.error = error.message; console.error(error.message); process.exitCode = 1; }
finally {
  if (files.length) { const removed = await admin.storage.from('invoices').remove(files); results.checks.push({ name: 'Synthetic phone files removed', passed: !removed.error }); }
  if (userId) { const removed = await removeDisposableAccount(admin, userId); results.checks.push({ name: 'Disposable account and unshared QA organizations removed', passed: !removed.error }); }
  await mkdir('output/audit', { recursive: true });
  await writeFile('output/audit/account-flow-results.json', JSON.stringify(results, null, 2));
  if (results.checks.some(item => !item.passed)) process.exitCode = 1;
}
