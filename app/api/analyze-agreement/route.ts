import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { business, vendor, location } = await req.json();

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
    const raw = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
    const result = JSON.parse(raw);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}