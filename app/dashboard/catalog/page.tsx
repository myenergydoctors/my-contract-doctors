"use client";
// Internal catalog review tool — intentionally not linked in the portal nav.
// Lists every vendor SKU the extraction pipeline has encountered, unmapped
// codes first (by how often they appear). Assigning a product here becomes a
// permanent "manual" mapping that future extractions apply deterministically.
// The map API is gated by ADMIN_EMAILS; this page is read-only for others.
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  REPLACEMENT_CATEGORY_LABELS,
  REPLACEMENT_TRACKING_CATEGORIES,
  type ReplacementTrackingCategory,
  type ReplacementTrackingEligibility,
} from "@/lib/service-replacement-history";

type Row = {
  id: string;
  vendor_item_code: string;
  display_name: string | null;
  product_id: string | null;
  mapping_source: "seed" | "ai" | "manual";
  catalog_status: "candidate" | "approved" | "rejected";
  times_seen: number;
  replacement_tracking_eligibility: ReplacementTrackingEligibility;
  replacement_tracking_category: ReplacementTrackingCategory | null;
  replacement_tracking_suggested_category: ReplacementTrackingCategory | null;
  vendors: { slug: string; name: string } | null;
};

type ProductOption = { id: string; slug: string; name: string; category: string };

export default function CatalogPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [trackingFilter, setTrackingFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(100);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const allRows: Row[] = [];
      for (let start = 0; ; start += 1000) {
        const page = await supabase
          .from("vendor_products")
          .select("id, vendor_item_code, display_name, product_id, mapping_source, catalog_status, times_seen, replacement_tracking_eligibility, replacement_tracking_category, replacement_tracking_suggested_category, vendors ( slug, name )")
          .order("times_seen", { ascending: false })
          .range(start, start + 999);
        if (page.error) throw page.error;
        const pageRows = (page.data || []) as unknown as Row[];
        allRows.push(...pageRows);
        if (pageRows.length < 1000) break;
      }
      const productResult = await supabase.from("products").select("id, slug, name, category").order("category").order("name");
      if (productResult.error) throw productResult.error;
      setRows(allRows);
      setProducts((productResult.data || []) as ProductOption[]);
    }
    load().catch(caught => setError(caught instanceof Error ? caught.message : "Could not load the catalog.")).finally(() => setLoading(false));
  }, []);

  useEffect(() => setVisibleCount(100), [vendorFilter, trackingFilter, search]);

  const vendors = useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach(r => { if (r.vendors) seen.set(r.vendors.slug, r.vendors.name); });
    return [...seen.entries()];
  }, [rows]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = rows.filter(row => {
      if (vendorFilter !== "all" && row.vendors?.slug !== vendorFilter) return false;
      if (trackingFilter === "suggested" && !row.replacement_tracking_suggested_category) return false;
      if (trackingFilter === "eligible" && row.replacement_tracking_eligibility !== "eligible") return false;
      if (trackingFilter === "unreviewed" && row.replacement_tracking_eligibility !== "unreviewed") return false;
      return !query || `${row.vendor_item_code} ${row.display_name || ""} ${row.vendors?.name || ""}`.toLowerCase().includes(query);
    });
    // Unmapped first, then by frequency
    return [...list].sort((a, b) =>
      (a.product_id === null ? 0 : 1) - (b.product_id === null ? 0 : 1) || b.times_seen - a.times_seen
    );
  }, [rows, vendorFilter, trackingFilter, search]);

  const visibleRows = filtered.slice(0, visibleCount);

  async function assign(row: Row, productId: string | null) {
    setSavingId(row.id);
    setError(null);
    const res = await fetch("/api/catalog/map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor_product_id: row.id, product_id: productId }),
    });
    if (res.ok) {
      setRows(prev => prev.map(r => r.id === row.id ? {
        ...r,
        product_id: productId,
        mapping_source: productId ? "manual" : (row.mapping_source === "seed" ? "seed" : "ai"),
        catalog_status: productId || row.mapping_source === "seed" ? "approved" : "candidate",
      } : r));
    } else {
      const j = await res.json().catch(() => null);
      setError(j?.error || "Could not save mapping.");
    }
    setSavingId(null);
  }

  async function classifyReplacement(row: Row, value: string) {
    const eligible = value.startsWith("eligible:");
    const eligibility: ReplacementTrackingEligibility = eligible ? "eligible" : value as ReplacementTrackingEligibility;
    const category = eligible ? value.slice("eligible:".length) as ReplacementTrackingCategory : null;
    setSavingId(row.id);
    setError(null);
    const res = await fetch("/api/catalog/map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor_product_id: row.id,
        replacement_tracking_eligibility: eligibility,
        replacement_tracking_category: category,
      }),
    });
    if (res.ok) {
      setRows(previous => previous.map(item => item.id === row.id ? {
        ...item,
        replacement_tracking_eligibility: eligibility,
        replacement_tracking_category: category,
      } : item));
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Could not save replacement tracking classification.");
    }
    setSavingId(null);
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-navy mb-1">Vendor product catalog</h1>
        <p className="font-sans font-light text-gray-500 leading-relaxed">
          This is the shared master catalog from vendor price lists plus new labels observed on invoices—not just items from your own account. Imported vendor products are approved identities; invoice-only labels remain candidates until reviewed.
        </p>
        <p className="mt-2 font-sans text-sm text-gray-500 leading-relaxed">
          Replacement tracking is a second, explicit review. An AI suggestion is only a hint; it never turns tracking on.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCell label="Codes in catalog" value={rows.length.toString()} accent="blue" />
        <StatCell label="Needs review" value={rows.filter(row => row.catalog_status === "candidate").length.toString()} accent="red" />
        <StatCell label="Approved" value={rows.filter(row => row.catalog_status === "approved").length.toString()} accent="teal" />
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search item code or description"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-navy"
          />
        {vendors.length > 1 && (
          <select
            value={vendorFilter}
            onChange={e => setVendorFilter(e.target.value)}
            className="font-sans text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-navy"
          >
            <option value="all">All vendors</option>
            {vendors.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
          </select>
        )}
        <select value={trackingFilter} onChange={event => setTrackingFilter(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-navy">
          <option value="all">All tracking states</option>
          <option value="suggested">Suggested for review</option>
          <option value="unreviewed">Tracking not reviewed</option>
          <option value="eligible">Tracking enabled</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 font-sans text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="font-sans text-sm text-gray-500">Loading catalog…</p>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="font-sans text-sm text-gray-500 leading-relaxed">
            No vendor item codes yet. The catalog fills itself as invoices are uploaded and extracted —
            or seed it from a known product list (see docs/supabase-schema-2c-2.sql).
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[0.7fr_0.8fr_1.3fr_0.4fr_1.2fr_1.4fr] gap-4 px-6 py-3 border-b border-gray-200 bg-off-white font-sans text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            <div>Vendor</div>
            <div>Item code</div>
            <div>Seen as</div>
            <div className="text-right">Seen</div>
            <div>Normalized product</div>
            <div>Replacement tracking</div>
          </div>
          {visibleRows.map(row => (
            <div key={row.id} className="px-6 py-3 border-b last:border-b-0 border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-[0.7fr_0.8fr_1.3fr_0.4fr_1.2fr_1.4fr] gap-2 md:gap-4 md:items-center">
                <div className="font-sans text-sm text-gray-600">{row.vendors?.name ?? "—"}</div>
                <div className="font-sans text-sm font-medium text-navy">{row.vendor_item_code}</div>
                <div className="font-sans text-sm text-gray-600 truncate" title={row.display_name ?? ""}>
                  {row.display_name ?? "—"}
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${row.catalog_status === "approved" ? "bg-teal-light text-teal" : "bg-amber/10 text-amber-700"}`}>
                    {row.catalog_status}
                  </span>
                </div>
                <div className="font-sans text-sm text-gray-500 md:text-right">{row.times_seen}×</div>
                <div className="flex items-center gap-2">
                  <select
                    value={row.product_id ?? ""}
                    disabled={savingId === row.id}
                    onChange={e => assign(row, e.target.value || null)}
                    className={`w-full font-sans text-sm border rounded-lg px-2 py-1.5 bg-white ${row.product_id ? "border-gray-200 text-navy" : "border-red-300 text-red-700"}`}
                  >
                    <option value="">— needs mapping —</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                    ))}
                  </select>
                  {row.mapping_source === "manual" && row.product_id && (
                    <span className="font-sans text-[10px] uppercase tracking-wider text-teal whitespace-nowrap" title="Manually confirmed — never overwritten by AI">✓</span>
                  )}
                </div>
                <div>
                  <select
                    value={row.replacement_tracking_eligibility === "eligible" && row.replacement_tracking_category ? `eligible:${row.replacement_tracking_category}` : row.replacement_tracking_eligibility}
                    disabled={savingId === row.id || row.catalog_status !== "approved"}
                    onChange={event => void classifyReplacement(row, event.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 font-sans text-xs text-navy disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="unreviewed">Needs explicit review</option>
                    <option value="ineligible">Not eligible</option>
                    {REPLACEMENT_TRACKING_CATEGORIES.map(category => (
                      <option key={category} value={`eligible:${category}`}>{REPLACEMENT_CATEGORY_LABELS[category]}</option>
                    ))}
                  </select>
                  {row.replacement_tracking_suggested_category && (
                    <div className="mt-1 font-sans text-[10px] leading-4 text-amber-700">
                      AI suggested: {REPLACEMENT_CATEGORY_LABELS[row.replacement_tracking_suggested_category]} — not applied
                    </div>
                  )}
                  {row.catalog_status !== "approved" && <div className="mt-1 font-sans text-[10px] text-gray-500">Approve the product first.</div>}
                </div>
              </div>
            </div>
          ))}
          {visibleRows.length < filtered.length && (
            <div className="p-4 text-center">
              <button type="button" onClick={() => setVisibleCount(count => count + 100)} className="rounded-lg border border-blue px-4 py-2 font-sans text-sm font-medium text-blue">Show 100 more</button>
              <div className="mt-2 font-sans text-xs text-gray-500">Showing {visibleRows.length} of {filtered.length}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value, accent }: { label: string; value: string; accent: "teal" | "red" | "blue" }) {
  const color = accent === "teal" ? "text-teal" : accent === "red" ? "text-red-600" : "text-blue";
  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4">
      <div className="font-sans text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{label}</div>
      <div className={`font-serif text-2xl ${color}`}>{value}</div>
    </div>
  );
}
