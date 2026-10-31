import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401, headers });
  const { data: profile, error } = await supabase.from("profiles").select("business_name,industry").eq("id", user.id).maybeSingle();
  if (error || !profile) return NextResponse.json({ error: "Your profile could not be loaded. Please retry." }, { status: 503, headers });
  // Onboarding preferences are user-editable and never authorize paid access.
  const saved = user.user_metadata?.onboarding;
  const draft = saved && typeof saved === "object" ? saved : {};
  return NextResponse.json({
    business: profile.business_name || "", industry: profile.industry || "",
    vendor: typeof draft.vendor === "string" ? draft.vendor : "",
    monthlySpend: typeof draft.monthlySpend === "string" ? draft.monthlySpend : "",
    step: Number.isInteger(draft.step) && draft.step >= 1 && draft.step <= 4 ? draft.step : 1,
    completed: draft.completed === true,
  }, { headers });
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401, headers });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !["business", "industry", "vendor", "monthlySpend"].every(key => typeof body[key] === "string" && body[key].length <= 100)
    || !Number.isInteger(body.step) || body.step < 1 || body.step > 4 || typeof body.completed !== "boolean") {
    return NextResponse.json({ error: "Please check your onboarding answers." }, { status: 400, headers });
  }
  const business = body.business.trim(), industry = body.industry.trim();
  if (!business || !industry) return NextResponse.json({ error: "Enter your business name and industry." }, { status: 400, headers });
  const { data: profile, error: profileError } = await supabase.from("profiles").update({ business_name: business, industry }).eq("id", user.id).select("id").maybeSingle();
  if (profileError || !profile) return NextResponse.json({ error: "Your business details could not be saved. Please retry." }, { status: 503, headers });
  const { error } = await supabase.auth.updateUser({ data: { onboarding: {
    vendor: body.vendor.trim(), monthlySpend: body.monthlySpend.trim(), step: body.step, completed: body.completed,
  } } });
  if (error) return NextResponse.json({ error: "Your progress could not be saved. Please retry." }, { status: 503, headers });
  return NextResponse.json({ ok: true }, { headers });
}
