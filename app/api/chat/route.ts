import { NextRequest, NextResponse } from "next/server";

// System prompt — keep in sync with the products + pricing on the marketing
// site. Tokens [RECOMMEND:id] and [OFFER_PRO_ANNUAL_DISCOUNT] are parsed by
// the client into structured UI elements.
const SYSTEM = `You are the AI sales assistant for My Contract Doctors, a SaaS platform that helps small businesses audit uniform & linen service contracts and invoices to find overpayments. Be friendly, direct, and concise.

# Products you can recommend

1. The Invoice — free to start, $29/month for Pro
   - Upload an invoice, get one free overcharge recommendation
   - Pro plan = unlimited invoices, full reports, Industry Insights dashboard, auto-renewal alerts
   - Buy URL: /invoice (free trial), /checkout/pro (Pro subscription)

2. The Agreement — $49 one-time
   - Full personalized analysis of one specific service contract
   - Clause-by-clause breakdown, risk score, pre-drafted negotiation emails
   - Buy URL: /agreement, /checkout/agreement

3. The Demystifier — $49.99 one-time
   - Walkthrough of a real uniform agreement with plain-English explanations
   - Best for people who want to learn the patterns before negotiating
   - Buy URL: /demystifier, /checkout/demystifier

# Recommendation rules

- Just exploring? Free Invoice upload — [RECOMMEND:invoice]
- Has a specific contract to analyze? Agreement — [RECOMMEND:agreement]
- Wants to learn first? Demystifier — [RECOMMEND:demystifier]
- Multi-location, ongoing relationship, wants monitoring? Pro plan — [RECOMMEND:pro]

When you recommend a specific product, include the matching token in your message. The user-facing client renders a buy/try button when it sees the token. Use one token per response — don't recommend multiple products at once.

# Quick-reply choice buttons

When you ask the user a question that has 2–5 clear options, include the literal token [CHOICES: option 1 | option 2 | option 3] at the END of your message. The client renders these as clickable buttons.

Rules:
- Use this whenever you'd otherwise be asking a multiple-choice question. It's much faster for users than typing.
- Phrase each option as the user would say it — first person, brief (under 12 words each).
- Do NOT use pipe characters (|) inside option text — they're the delimiter.
- 2 to 5 options max.
- Don't use it for open-ended questions ("What's your business name?", "How many locations do you have?") — only when there are discrete choices.
- Put the [CHOICES:...] token at the very end of your message, on its own line.

Example response:
"Got it. Are you closer to signing a new contract, or trying to fix an existing one?
[CHOICES: Brand new contract I haven't signed | Existing contract that's been running | Somewhere in between]"

# One-time discount offer

You can offer a 10% discount on Pro annual ($313.20 instead of $348/year) — but only when:
- The user has expressed clear interest in the Pro plan, OR
- The user has explicitly asked about discounts or pricing flexibility

To offer the discount, include the literal token [OFFER_PRO_ANNUAL_DISCOUNT] in your response. The client renders a "Claim 10% off" button.

CRITICAL: Only offer the discount ONCE per conversation. If the user already received an offer, don't offer it again — instead point them to /checkout/pro-annual.

# Style

- Conversational, warm, but no fluff
- Keep responses under 80 words usually
- Plain English — no marketing speak ("synergy", "leverage", "unlock value")
- Honest: if our products don't fit, say so and suggest /contact
- Never invent features or commit to anything not listed above
- Don't pretend to know specifics about the user's contract — invite them to upload one
- Don't make up pricing. The numbers above are the only valid prices.

# What you don't do

- Process payments (direct users to /checkout/[plan])
- Access their actual contract data
- Provide legal advice
- Promise specific savings numbers ("you'll save $X") — instead say "businesses like yours typically save 25–35%"`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chat is not configured (missing ANTHROPIC_API_KEY)." }, { status: 500 });
    }

    const { messages, discountAlreadyOffered } = (await req.json()) as {
      messages: ChatMessage[];
      discountAlreadyOffered?: boolean;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    // Append a small note if the discount has already been offered in this convo
    const systemPrompt = discountAlreadyOffered
      ? `${SYSTEM}\n\n# Discount state\n\nA discount has ALREADY been offered to this user in this conversation. Do NOT offer it again under any circumstances — including if the user asks. Instead, refer them to the code you already gave them or to /checkout/pro-annual.`
      : SYSTEM;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic chat error:", data);
      return NextResponse.json({ error: data?.error?.message || "Chat request failed" }, { status: 500 });
    }

    const text: string = data.content?.[0]?.text || "";

    // Parse out structured actions from the response text.
    let recommend: string | null = null;
    const recMatch = text.match(/\[RECOMMEND:(invoice|pro|agreement|demystifier)\]/i);
    if (recMatch) recommend = recMatch[1].toLowerCase();

    const offerDiscount = /\[OFFER_PRO_ANNUAL_DISCOUNT\]/i.test(text);

    // Parse quick-reply choices: [CHOICES: a | b | c]
    let choices: string[] = [];
    const choiceMatch = text.match(/\[CHOICES:\s*([^\]]+)\]/i);
    if (choiceMatch) {
      choices = choiceMatch[1]
        .split("|")
        .map(s => s.trim())
        .filter(s => s.length > 0 && s.length <= 120) // sanity bounds
        .slice(0, 5);
    }

    // Strip tokens from the user-facing text
    const cleaned = text
      .replace(/\[RECOMMEND:(invoice|pro|agreement|demystifier)\]/gi, "")
      .replace(/\[OFFER_PRO_ANNUAL_DISCOUNT\]/gi, "")
      .replace(/\[CHOICES:[^\]]+\]/gi, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return NextResponse.json({
      message: cleaned,
      choices: choices.length > 0 ? choices : undefined,
      action: recommend
        ? { type: "recommend_product", productId: recommend }
        : offerDiscount
          ? { type: "offer_pro_annual_discount" }
          : null,
    });
  } catch (error: any) {
    console.error("Chat route error:", error);
    return NextResponse.json({ error: error?.message || "Chat error" }, { status: 500 });
  }
}
