import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    error: "invoice_demo_retired",
    message: "Upload a real invoice through /invoice so findings are based on reviewed, confirmed data.",
  }, {
    status: 410,
    headers: { "Cache-Control": "no-store" },
  });
}
