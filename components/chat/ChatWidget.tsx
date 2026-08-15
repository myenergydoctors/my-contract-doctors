"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { claimChatDiscount } from "@/lib/discount-codes";

type Action = { type: "recommend_product"; productId: string } | { type: "offer_pro_annual_discount" };
type Message = { role: "user" | "assistant"; content: string; action?: Action | null; claimedCode?: string; choices?: string[]; choicesAnswered?: boolean };

const productMeta: Record<string, { name: string; price: string; href: string; cta: string }> = {
  invoice:     { name: "The Invoice",   price: "Free to start",   href: "/invoice",                 cta: "Try free →" },
  pro:         { name: "Pro plan",      price: "$29 / month",     href: "/checkout/pro",            cta: "Get Pro →" },
  agreement:   { name: "The Agreement", price: "$49 one-time",    href: "/checkout/agreement",      cta: "Analyze →" },
  demystifier: { name: "The Demystifier", price: "$49.99 one-time", href: "/checkout/demystifier",  cta: "Walk through →" },
};

const HIDE_ON_PREFIXES = ["/dashboard", "/checkout", "/onboarding", "/sign-in", "/sign-up", "/check-email"];

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm the My Contract Doctors assistant. What's your main concern right now?",
      choices: [
        "Suspicious about my current invoices — check for overcharges",
        "Looking at a new contract — help me understand what I'm signing",
        "Want to learn how these contracts work before negotiating",
        "Something else",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [discountOffered, setDiscountOffered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Hide on portal/auth/checkout pages — placed AFTER all hooks per rules of hooks
  if (HIDE_ON_PREFIXES.some(p => pathname?.startsWith(p))) return null;

  const sendText = async (text: string, history?: Message[]) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const base = history ?? messages;
    const next: Message[] = [...base, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
          discountAlreadyOffered: discountOffered,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chat error");
      const assistantMsg: Message = {
        role: "assistant",
        content: data.message || "(no response)",
        action: data.action || null,
        choices: Array.isArray(data.choices) && data.choices.length > 0 ? data.choices : undefined,
      };
      if (data.action?.type === "offer_pro_annual_discount") setDiscountOffered(true);
      setMessages(m => [...m, assistantMsg]);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const send = () => sendText(input);

  const pickChoice = (msgIndex: number, choice: string) => {
    // Mark the prior assistant message's choices as answered so they collapse
    const updated = messages.map((m, i) => i === msgIndex ? { ...m, choicesAnswered: true } : m);
    setMessages(updated);
    sendText(choice, updated);
  };

  const claimDiscount = async (msgIndex: number) => {
    try {
      const claimed = await claimChatDiscount();
      setMessages(m => m.map((msg, i) => i === msgIndex ? { ...msg, claimedCode: claimed.code } : msg));
    } catch {
      setError("Couldn't generate a discount code right now — try again in a moment.");
    }
  };

  return (
    <>
      {/* Bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          className="fixed bottom-5 right-5 z-[90] w-14 h-14 rounded-full bg-teal text-white shadow-2xl flex items-center justify-center text-2xl hover:scale-105 transition-transform cursor-pointer"
          style={{ boxShadow: "0 10px 30px rgba(23, 168, 130, 0.4)" }}
        >
          💬
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="fixed z-[90] bottom-5 right-5 left-5 sm:left-auto sm:w-[380px] h-[min(600px,calc(100vh-40px))] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ boxShadow: "0 20px 60px rgba(12, 45, 84, 0.25)" }}
        >
          {/* Header */}
          <div className="bg-navy text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-teal flex items-center justify-center text-lg flex-shrink-0">▣</div>
              <div className="min-w-0">
                <div className="font-serif text-base leading-tight truncate">Contract Assistant</div>
                <div className="font-sans text-[11px] text-white/60 leading-tight">Powered by AI — usually under 10s</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg leading-none flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 bg-off-white flex flex-col gap-3">
            {messages.map((m, i) => (
              <MessageBubble
                key={i}
                msg={m}
                onClaim={() => claimDiscount(i)}
                onPickChoice={(c) => pickChoice(i, c)}
                disabled={loading}
              />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-light border border-red text-red font-sans text-xs rounded-lg p-3">
                {error}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-gray-200 p-3 bg-white flex-shrink-0">
            <form
              onSubmit={e => {
                e.preventDefault();
                send();
              }}
              className="flex gap-2 items-end"
            >
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask about products, pricing, or contracts…"
                rows={1}
                className="flex-1 font-sans text-sm text-navy bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue transition-colors resize-none max-h-24 placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="font-sans text-sm font-medium bg-teal text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                Send
              </button>
            </form>
            <p className="font-sans text-[10px] text-gray-400 mt-2 text-center">
              AI-generated. May make mistakes — verify pricing on the Pricing page.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function MessageBubble({ msg, onClaim, onPickChoice, disabled }: { msg: Message; onClaim: () => void; onPickChoice: (choice: string) => void; disabled: boolean }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        <div className={`px-4 py-3 rounded-2xl font-sans text-sm leading-relaxed whitespace-pre-wrap ${isUser ? "bg-navy text-white rounded-br-md" : "bg-white border border-gray-200 text-navy rounded-bl-md"}`}>
          {msg.content}
        </div>

        {/* Quick-reply choice buttons */}
        {msg.choices && msg.choices.length > 0 && !msg.choicesAnswered && (
          <div className="flex flex-col gap-1.5 w-full">
            {msg.choices.map((c, idx) => (
              <button
                key={idx}
                onClick={() => onPickChoice(c)}
                disabled={disabled}
                className="text-left font-sans text-sm text-blue bg-white border border-blue/30 hover:bg-blue-pale/40 hover:border-blue rounded-xl px-4 py-2.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed leading-snug"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Product recommendation card */}
        {msg.action?.type === "recommend_product" && productMeta[msg.action.productId] && (
          <ProductCard productId={msg.action.productId} />
        )}

        {/* Discount offer card */}
        {msg.action?.type === "offer_pro_annual_discount" && !msg.claimedCode && (
          <button
            onClick={onClaim}
            className="bg-gradient-to-br from-teal to-blue text-white rounded-xl p-4 text-left w-full hover:opacity-95 transition-opacity cursor-pointer"
          >
            <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-white/80 mb-1">One-time offer</div>
            <div className="font-serif text-base leading-tight mb-1">10% off Pro annual</div>
            <div className="font-sans text-xs text-white/80 mb-2">$313.20/year (saves $34.80 vs paying monthly)</div>
            <div className="font-sans text-sm font-medium">Claim your code →</div>
          </button>
        )}

        {/* Claimed discount reveal */}
        {msg.claimedCode && (
          <div className="bg-white border-2 border-teal rounded-xl p-4 w-full">
            <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-teal mb-2">Your one-time code</div>
            <div className="font-serif text-navy text-lg tracking-wider mb-2 select-all">{msg.claimedCode}</div>
            <div className="font-sans text-xs text-gray-500 leading-relaxed mb-3">
              Single use. Apply at checkout for 10% off Pro annual.
            </div>
            <Link
              href="/checkout/pro-annual"
              className="block bg-teal text-white font-sans text-sm font-medium px-4 py-2.5 rounded-lg no-underline text-center hover:opacity-90 transition-opacity"
            >
              Go to checkout →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ productId }: { productId: string }) {
  const p = productMeta[productId];
  if (!p) return null;
  return (
    <Link
      href={p.href}
      className="bg-white border border-gray-200 hover:border-blue rounded-xl p-4 no-underline transition-colors w-full block"
    >
      <div className="flex justify-between items-start gap-3 mb-1">
        <div className="font-serif text-navy text-base leading-tight">{p.name}</div>
        <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-blue-pale text-blue px-2 py-0.5 rounded flex-shrink-0">Suggested</span>
      </div>
      <div className="font-sans text-xs text-gray-500 mb-3">{p.price}</div>
      <div className="font-sans text-sm font-medium text-blue">{p.cta}</div>
    </Link>
  );
}
