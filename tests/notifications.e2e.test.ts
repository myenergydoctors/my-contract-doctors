import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { loadRoute } from "./helpers/load-route.mjs";
import { removeDisposableAccount } from "../scripts/lib/qa-cleanup.mjs";

const enabled = process.env.NOTIFICATION_E2E === "true"
  && process.env.NEXT_PUBLIC_SUPABASE_URL === "https://xrchncayomnwcnphrwhx.supabase.co"
  && process.env.NOTIFICATION_E2E_PROJECT === "xrchncayomnwcnphrwhx"
  && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

test("real notification delivery is idempotent, read state persists, and other accounts remain isolated", { skip: !enabled }, async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const users: string[] = [];
  try {
    const clients = [];
    for (let i = 0; i < 2; i++) {
      const email = `account-flow-${randomUUID()}@example.invalid`, password = randomUUID();
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      assert.ifError(created.error); users.push(created.data.user!.id);
      const client = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
      assert.ifError((await client.auth.signInWithPassword({ email, password })).error); clients.push(client);
    }
    const { saveAnalysisNotification } = loadRoute("lib/db/analysis-notifications-server.ts", { "@/lib/supabase/admin": { createAdminClient: () => admin } });
    const analysisId = randomUUID();
    assert.equal(await saveAnalysisNotification(users[0], "invoice", analysisId, "ready"), true);
    assert.equal(await saveAnalysisNotification(users[1], "agreement", randomUUID(), "ready"), true);
    const listed = await clients[0].from("notifications").select("id,user_id,unread,href");
    assert.ifError(listed.error); assert.equal(listed.data!.length, 1); assert.equal(listed.data![0].user_id, users[0]);
    const id = listed.data![0].id;
    assert.ifError((await clients[0].from("notifications").update({ unread: false }).eq("id", id)).error);
    assert.equal(await saveAnalysisNotification(users[0], "invoice", analysisId, "ready"), true);
    const reopened = await clients[0].from("notifications").select("id,unread");
    assert.ifError(reopened.error); assert.equal(reopened.data!.length, 1); assert.equal(reopened.data![0].unread, false);
    const denied = await clients[1].from("notifications").update({ unread: true }).eq("id", id).select("id");
    assert.ifError(denied.error); assert.equal(denied.data!.length, 0);
    assert.equal(await saveAnalysisNotification(users[0], "invoice", analysisId, "failed"), true);
    const events = await clients[0].from("notifications").select("id");
    assert.ifError(events.error); assert.equal(events.data!.length, 2);
  } finally {
    for (const id of users) assert.ifError((await removeDisposableAccount(admin, id)).error);
  }
});
