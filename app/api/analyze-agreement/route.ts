import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const limit = await checkRateLimit(req, { namespace: "agreement-demo", maxRequests: 5, windowSeconds: 900 });
    if (!limit.allowed) return rateLimitResponse(limit);

    const { business, vendor, location } = await req.json();

    if (
      (business !== undefined && (typeof business !== "string" || business.length > 200)) ||
      (vendor !== undefined && (typeof vendor !== "string" || vendor.length > 200)) ||
      (location !== undefined && (typeof location !== "string" || location.length > 200))
    ) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: `You are a contract analyst for My Contract Doctors. Business: "${business || "the customer"}", location: "${location || "their area"}", vendor: "${vendor || "a uniform vendor"}". Return ONLY valid JSON (no markdown fences) with this exact shape:
{"vendor":"string","business":"string","location":"string","contractNum":"string","weeklyValue":number,"annualValue":number,"contractTerm":number,"autoRenewalDays":number,"score":number,"scoreLabel":"string","annualOverpayEstimate":number,"contractLifeOverpay":number,"clauses":[{"id":"string","label":"string","risk":"high|medium|low","contractText":"string","finding":"string","recommendation":"string","annualImpact":"number or null","flag":"bad|warn|watch|ok"}],"topActions":["string","string","string","string"]}`,
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error("AI provider request failed.");
    const raw = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
    const result = JSON.parse(raw);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
