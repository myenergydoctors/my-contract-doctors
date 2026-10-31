import { NextRequest, NextResponse } from "next/server";
import { notificationAccount, notificationError, privateHeaders } from "@/lib/notifications/api";
async function administrator(request: NextRequest, write = false) {
  const access = await notificationAccount(request, write); if (access.response) return access;
  const { data, error } = await access.admin!.from("profiles").select("is_admin").eq("id", access.user!.id).maybeSingle();
  if (error || !data?.is_admin) return { response: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
  return access;
}
export async function GET(request: NextRequest) {
  const access = await administrator(request); if (access.response) return access.response;
  const { data, error } = await access.admin!.from("notification_email_jobs").select("id,user_id,category,status,attempts,last_error,created_at").in("status", ["uncertain", "failed"]).order("created_at", { ascending: false }).limit(100);
  if (error) return notificationError(error);
  return NextResponse.json({ jobs: data }, { headers: privateHeaders });
}
export async function POST(request: NextRequest) {
  const access = await administrator(request, true); if (access.response) return access.response;
  const body = await request.json().catch(() => null);
  if (!/^[a-f0-9-]{36}$/i.test(body?.jobId ?? "") || !["confirmed_sent", "confirmed_not_sent"].includes(body?.outcome) || typeof body?.note !== "string" || body.note.trim().length < 5 || body.note.length > 500) return NextResponse.json({ error: "Record the verified provider outcome and a note." }, { status: 400 });
  const { data, error } = await access.admin!.rpc("resolve_notification_email_job", { p_id: body.jobId, p_actor: access.user!.id, p_outcome: body.outcome, p_note: body.note });
  if (error) return notificationError(error);
  return NextResponse.json({ ok: data === true }, { status: data ? 200 : 409, headers: privateHeaders });
}
