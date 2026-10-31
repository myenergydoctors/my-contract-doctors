import { NextResponse } from "next/server";
import { demystifierSnapshot } from "@/lib/demystifier/server";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
export async function GET() {
  try { return NextResponse.json(await demystifierSnapshot(), { headers }); }
  catch { return NextResponse.json({ error: "Access could not be checked. Please retry. Your saved access has not been changed." }, { status: 503, headers }); }
}
