"use client";
// Internal catalog review tool — intentionally not linked in the portal nav.
// Lists every vendor SKU the extraction pipeline has encountered, unmapped
// codes first (by how often they appear). Assigning a product here becomes a
// permanent "manual" mapping that future extractions apply deterministically.
// The map API is gated by ADMIN_EMAILS; this page is read-only for others.
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Row = {
  id: string;
  vendor_item_code: string;
  display_name: string | null;
  product_id: string | null;
  mapping_source: "seed" | "ai" | "manual";
  times_seen: number;
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

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase
        .from("vendor_products")
        .select("id, vendor_item_code, display_name, product_id, mapping_source, times_seen, vendors ( slug, name )")
        .order("times_seen", { ascending: false }),
      supabase.from("products").select("id, slug, name, category").order("category").order("name"),
    ]).then(([vp, p]) => {
      if (vp.data) setRows(vp.data as unknown as Row[]);
      if (p.data) setProducts(p.data as ProductOption[]);
      setLoading(false);
    });
  }, []);

  const vendors = useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach(r => { if (r.vendors) seen.set(r.vendors.slug, r.vendors.name); });
    return [...seen.entries()];
  }, [rows]);

  const filtered = useMemo(() => {
    const list = vendorFilter === "all" ? rows : rows.filter(r => r.vendors?.slug === vendorFilter);
    // Unmapped first, then by frequency
    return [...list].sort((a, b) =>
      (a.product_id === null ? 0 : 1) - (b.product_id === null ? 0 : 1) || b.times_seen - a.times_seen
    );
  }, [rows, vendorFilter]);

  const unmappedCount = rows.filter(r => r.product_id === null).length;

  async function assign(row: Row, productId: string | null) {
    setSavingId(row.id);
    setError(null);
    const res = await fetch("/api/catalog/map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor_product_id: row.id, product_id: productId }),
    });
    if (res.ok) {
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, product_id: productId, mapping_source: "manual" } : r));
    } else {
      const j = await res.json().catch(() => null);
      setError(j?.error || "Could not save mapping.");
    }
    setSavingId(null);
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-navy mb-1">Vendor product catalog</h1>
        <p className="font-sans font-light text-gray-500 leading-relaxed">
          Every item code seen on an uploaded invoice. Map codes to normalized products so pricing
          becomes comparable across customers and regions — mappings are permanent and applied to all
          future extractions automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCell label="Codes in catalog" value={rows.length.toString()} accent="blue" />
        <StatCell label="Needs mapping" value={unmappedCount.toString()} accent="red" />
        <StatCell label="Mapped" value={(rows.length - unmappedCount).toString()} accent="teal" />
      </div>

      {vendors.length > 1 && (
        <div className="mb-4">
          <select
            value={vendorFilter}
            onChange={e => setVendorFilter(e.target.value)}
            className="font-sans text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-navy"
          >
            <option value="all">All vendors</option>
            {vendors.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
          </select>
        </div>
      )}

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
          <div className="hidden md:grid grid-cols-[0.8fr_1fr_1.6fr_0.5fr_1.4fr] gap-4 px-6 py-3 border-b border-gray-200 bg-off-white font-sans text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            <div>Vendor</div>
            <div>Item code</div>
            <div>Seen as</div>
            <div className="text-right">Seen</div>
            <div>Normalized product</div>
          </div>
          {filtered.map(row => (
            <div key={row.id} className="px-6 py-3 border-b last:border-b-0 border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1fr_1.6fr_0.5fr_1.4fr] gap-2 md:gap-4 md:items-center">
                <div className="font-sans text-sm text-gray-600">{row.vendors?.name ?? "—"}</div>
                <div className="font-sans text-sm font-medium text-navy">{row.vendor_item_code}</div>
                <div className="font-sans text-sm text-gray-600 truncate" title={row.display_name ?? ""}>
                  {row.display_name ?? "—"}
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
              </div>
            </div>
          ))}
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
