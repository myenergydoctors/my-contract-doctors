"use client";
import { useEffect, useState } from "react";
import type { DiscountCodeRow } from "@/lib/supabase/database.types";

const PLANS: DiscountCodeRow["plan"][] = ["pro", "pro-annual", "agreement", "demystifier"];

function randomCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "MCD-";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export default function DiscountCodesAdmin() {
  const [codes, setCodes] = useState<DiscountCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [code, setCode] = useState(randomCode());
  const [plan, setPlan] = useState<DiscountCodeRow["plan"]>("pro");
  const [pct, setPct] = useState("10");
  const [maxUses, setMaxUses] = useState(""); // empty = unlimited
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/discount-codes");
    if (!res.ok) {
      setError("Couldn't load discount codes.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setCodes(data.codes || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createCode(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    const res = await fetch("/api/discount-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        plan,
        discount_pct: Number(pct) / 100,
        max_uses: maxUses ? Number(maxUses) : null,
        note: note || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      }),
    });
    setCreating(false);
    const data = await res.json();
    if (!res.ok) {
      setCreateError(data.error || "Couldn't create that code.");
      return;
    }
    setCode(randomCode());
    setNote("");
    setMaxUses("");
    setExpiresAt("");
    load();
  }

  async function toggleActive(row: DiscountCodeRow) {
    await fetch(`/api/discount-codes/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
    load();
  }

  return (
    <div className="max-w-5xl flex flex-col gap-6">
      <div>
        <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue mb-1">Admin</div>
        <h1 className="font-serif text-navy text-2xl">Discount codes</h1>
        <p className="font-sans font-light text-gray-500 leading-relaxed mt-1">
          Create one-off single-use codes or shared multi-use codes. All redemptions are tracked server-side.
        </p>
      </div>

      {/* Create form */}
      <form onSubmit={createCode} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
        <h3 className="font-serif text-navy text-lg">New code</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LabeledInput label="Code" value={code} onChange={setCode} placeholder="MCD-XXXXXX" required />
          <LabeledSelect label="Plan" value={plan} onChange={v => setPlan(v as DiscountCodeRow["plan"])} options={PLANS} />
          <LabeledInput label="Discount %" value={pct} onChange={setPct} placeholder="10" type="number" required />
          <LabeledInput label="Max uses (empty = unlimited)" value={maxUses} onChange={setMaxUses} placeholder="e.g. 1 for a one-off, 100 for shared" type="number" />
          <LabeledInput label="Note (internal)" value={note} onChange={setNote} placeholder="e.g. Black Friday 2026" />
          <LabeledInput label="Expires (optional)" value={expiresAt} onChange={setExpiresAt} type="date" />
        </div>
        {createError && <p className="font-sans text-xs text-red">{createError}</p>}
        <button
          type="submit"
          disabled={creating}
          className="self-start font-sans text-sm font-medium bg-navy text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60"
        >
          {creating ? "Creating…" : "Create code"}
        </button>
      </form>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-serif text-navy text-lg">All codes</h3>
        </div>
        {loading ? (
          <p className="font-sans text-sm text-gray-500 p-6">Loading…</p>
        ) : error ? (
          <p className="font-sans text-sm text-red p-6">{error}</p>
        ) : codes.length === 0 ? (
          <p className="font-sans text-sm text-gray-500 p-6">No codes yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Discount</th>
                  <th className="px-6 py-3">Uses</th>
                  <th className="px-6 py-3">Source</th>
                  <th className="px-6 py-3">Note</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {codes.map(c => (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="px-6 py-3 text-navy font-medium">{c.code}</td>
                    <td className="px-6 py-3 text-gray-600">{c.plan}</td>
                    <td className="px-6 py-3 text-gray-600">{Math.round(c.discount_pct * 100)}%</td>
                    <td className="px-6 py-3 text-gray-600">{c.times_redeemed}{c.max_uses !== null ? ` / ${c.max_uses}` : " / ∞"}</td>
                    <td className="px-6 py-3 text-gray-600">{c.source}</td>
                    <td className="px-6 py-3 text-gray-500">{c.note || "—"}</td>
                    <td className="px-6 py-3">
                      <span className={`font-sans text-xs px-2 py-1 rounded-full ${c.active ? "bg-teal-light text-teal" : "bg-gray-100 text-gray-500"}`}>
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => toggleActive(c)}
                        className="font-sans text-xs text-blue hover:text-navy bg-transparent border-none cursor-pointer"
                      >
                        {c.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full font-sans text-sm text-navy bg-white rounded-lg px-3.5 py-2.5 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors placeholder:text-gray-400"
      />
    </div>
  );
}

function LabeledSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full font-sans text-sm text-navy bg-white rounded-lg px-3.5 py-2.5 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
