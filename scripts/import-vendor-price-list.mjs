import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const EXPECTED_PROJECT_REF = "xrchncayomnwcnphrwhx";
const manifestArgument = process.argv.find(argument => argument.endsWith(".json"));
if (!manifestArgument) throw new Error("Pass the local normalized vendor price-list JSON file to import.");
const manifestPath = path.resolve(manifestArgument);
const apply = process.argv.includes("--apply");

function parseEnv(contents) {
  const values = {};
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return values;
}

const localEnv = parseEnv(await fs.readFile(path.resolve(".env.local"), "utf8"));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || localEnv.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase import credentials.");
const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
if (projectRef !== EXPECTED_PROJECT_REF) {
  throw new Error(`Refusing to import into unexpected Supabase project ${projectRef}.`);
}

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
if (manifest.schemaVersion !== 1 || manifest.source?.contractReference !== "25223") {
  throw new Error("Unsupported or unexpected vendor price-list manifest.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const normalizeDescription = description => String(description || "")
  .toUpperCase()
  .replace(/\s*\([0-9]{1,10}\)\s*$/, "")
  .replace(/[^A-Z0-9]+/g, " ")
  .trim();
const canonicalCode = (code, vendorSlug) => {
  const normalized = String(code || "").trim().toUpperCase().replace(/\s+/g, "");
  return vendorSlug === "cintas" ? normalized.replace(/^X(?=\d+$)/, "") : normalized;
};
const variantPart = attributes => Object.entries(attributes || {})
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([key, value]) => `${key.toUpperCase()}=${normalizeDescription(String(value))}`)
  .join("::");
const sourceKey = (item, vendorSlug) => [
  canonicalCode(item.vendorItemCode, vendorSlug) || "NO-CODE",
  normalizeDescription(item.description),
  variantPart(item.sourceAttributes),
].filter(Boolean).join("::");
const chunks = (rows, size = 100) => Array.from({ length: Math.ceil(rows.length / size) }, (_, index) => rows.slice(index * size, (index + 1) * size));

async function requireResult(promise, label) {
  const result = await promise;
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function ensureVendor(vendor) {
  const existing = await requireResult(supabase.from("vendors").select("id, slug, name, aliases, website").eq("slug", vendor.slug).maybeSingle(), `Read vendor ${vendor.slug}`);
  if (!apply) return existing || { id: `dry-run:${vendor.slug}`, ...vendor };
  const payload = { slug: vendor.slug, name: vendor.name, aliases: vendor.aliases || [], website: vendor.website || null };
  if (existing) {
    return await requireResult(supabase.from("vendors").update(payload).eq("id", existing.id).select("id, slug").single(), `Update vendor ${vendor.slug}`);
  }
  return await requireResult(supabase.from("vendors").insert(payload).select("id, slug").single(), `Create vendor ${vendor.slug}`);
}

async function loadVendorProducts(vendorId) {
  if (!apply) return [];
  return await requireResult(
    supabase.from("vendor_products")
      .select("id, vendor_item_code, display_name, source_key, product_id, mapping_source, catalog_status, replacement_tracking_eligibility, replacement_tracking_category")
      .eq("vendor_id", vendorId)
      .range(0, 4999),
    "Read existing vendor products",
  ) || [];
}

async function importProducts(vendor, vendorRow) {
  const existing = await loadVendorProducts(vendorRow.id);
  const existingByIdentity = new Map();
  for (const row of existing) {
    const identity = `${canonicalCode(row.vendor_item_code, vendor.slug)}::${normalizeDescription(row.display_name)}`;
    const bucket = existingByIdentity.get(identity) || [];
    bucket.push(row);
    existingByIdentity.set(identity, bucket);
  }

  const prepared = vendor.items.map(item => {
    const identity = `${canonicalCode(item.vendorItemCode, vendor.slug)}::${normalizeDescription(item.description)}`;
    const identityMatches = existingByIdentity.get(identity) || [];
    const exactSourceKey = sourceKey(item, vendor.slug);
    const prior = identityMatches.find(row => row.source_key === exactSourceKey)
      || (identityMatches.length === 1 ? identityMatches[0] : null);
    const humanMapped = prior?.mapping_source === "manual";
    return {
      manifestItem: item,
      payload: {
        vendor_id: vendorRow.id,
        vendor_item_code: canonicalCode(item.vendorItemCode, vendor.slug) || null,
        display_name: item.description,
        description: item.description,
        source_key: prior?.source_key || exactSourceKey,
        product_id: humanMapped ? prior.product_id : null,
        mapping_source: humanMapped ? "manual" : "seed",
        catalog_status: "approved",
        attributes: item.sourceAttributes || {},
        source_type: "imported_price_list",
        source_reference: `${manifest.source.fileName}#${item.sourceSheet}!${item.sourceRow}`,
        replacement_tracking_suggested_category: item.suggestedReplacementCategory || null,
        replacement_tracking_suggestion_source: item.suggestedReplacementCategory ? "catalog_import_rule" : null,
      },
    };
  });

  if (!apply) return { prepared, productBySourceKey: new Map(), upgradedCandidates: 0 };
  const productBySourceKey = new Map();
  const uniquePayloads = [...new Map(prepared.map(row => [row.payload.source_key, row.payload])).values()];
  for (const batch of chunks(uniquePayloads)) {
    const saved = await requireResult(
      supabase.from("vendor_products").upsert(batch, { onConflict: "vendor_id,source_key" }).select("id, source_key"),
      `Import products for ${vendor.slug}`,
    );
    for (const row of saved || []) productBySourceKey.set(row.source_key, row.id);
  }
  return {
    prepared,
    productBySourceKey,
    upgradedCandidates: uniquePayloads.filter(payload => existing.some(row => row.source_key === payload.source_key && row.catalog_status === "candidate")).length,
  };
}

async function ensurePriceList(vendor, vendorRow) {
  if (!apply) return { id: `dry-run:price-list:${vendor.slug}` };
  const definition = vendor.priceList;
  const existing = await requireResult(
    supabase.from("vendor_price_lists")
      .select("id")
      .eq("vendor_id", vendorRow.id)
      .eq("name", definition.name)
      .eq("contract_reference", manifest.source.contractReference)
      .eq("version_label", definition.versionLabel)
      .maybeSingle(),
    `Read price list for ${vendor.slug}`,
  );
  const payload = {
    vendor_id: vendorRow.id,
    organization_id: null,
    name: definition.name,
    scope: "public_contract",
    contract_reference: manifest.source.contractReference,
    effective_from: definition.effectiveFrom,
    territories: definition.territories,
    currency_code: "USD",
    version_label: definition.versionLabel,
    source_document_path: `catalog://${manifest.source.contractReference}/${encodeURIComponent(definition.sourceSheet)}`,
    source_metadata: { file_name: manifest.source.fileName, source_sheet: definition.sourceSheet, imported_schema_version: manifest.schemaVersion },
    status: "active",
  };
  if (existing) {
    return await requireResult(supabase.from("vendor_price_lists").update(payload).eq("id", existing.id).select("id").single(), `Update price list for ${vendor.slug}`);
  }
  return await requireResult(supabase.from("vendor_price_lists").insert(payload).select("id").single(), `Create price list for ${vendor.slug}`);
}

async function importPriceListItems(vendor, priceList, productResult) {
  if (!apply) return { items: vendor.items.length, rates: vendor.items.reduce((sum, item) => sum + item.rates.length, 0) };
  const productKeyByRow = new Map(productResult.prepared.map(({ manifestItem, payload }) => [manifestItem.sourceRow, payload.source_key]));
  const itemPayloads = vendor.items.map(item => ({
    price_list_id: priceList.id,
    vendor_product_id: productResult.productBySourceKey.get(productKeyByRow.get(item.sourceRow)) || null,
    source_sheet: item.sourceSheet,
    source_row: item.sourceRow,
    source_item_code: item.vendorItemCode,
    source_description: item.description,
    source_category: item.sourceCategory,
    source_attributes: item.sourceAttributes || {},
    minimum_percentage: item.minimumPercentage ?? null,
    raw_source_data: item.rawSourceData || {},
    match_status: "confirmed",
    match_confidence: 1,
  }));
  const itemIdByRow = new Map();
  for (const batch of chunks(itemPayloads)) {
    const saved = await requireResult(
      supabase.from("vendor_price_list_items").upsert(batch, { onConflict: "price_list_id,source_sheet,source_row" }).select("id, source_row"),
      `Import price-list rows for ${vendor.slug}`,
    );
    for (const row of saved || []) itemIdByRow.set(row.source_row, row.id);
  }
  const importedItemIds = [...itemIdByRow.values()];
  for (const batch of chunks(importedItemIds, 250)) {
    await requireResult(supabase.from("vendor_price_list_rates").delete().in("price_list_item_id", batch), `Refresh rates for ${vendor.slug}`);
  }
  const ratePayloads = vendor.items.flatMap(item => item.rates.map(rateRow => ({
    price_list_item_id: itemIdByRow.get(item.sourceRow),
    rate_type: rateRow.rateType,
    amount: rateRow.amount,
    billing_basis: rateRow.billingBasis || null,
    service_frequency: rateRow.serviceFrequency || null,
    conditions: {},
  }))).filter(row => row.price_list_item_id);
  for (const batch of chunks(ratePayloads, 250)) {
    await requireResult(supabase.from("vendor_price_list_rates").insert(batch), `Import rates for ${vendor.slug}`);
  }
  return { items: itemPayloads.length, rates: ratePayloads.length };
}

const report = [];
for (const vendor of manifest.vendors) {
  const vendorRow = await ensureVendor(vendor);
  const productResult = await importProducts(vendor, vendorRow);
  const priceList = await ensurePriceList(vendor, vendorRow);
  const priceResult = await importPriceListItems(vendor, priceList, productResult);
  report.push({
    vendor: vendor.slug,
    products: productResult.prepared.length,
    suggestedForReplacementReview: productResult.prepared.filter(row => row.payload.replacement_tracking_suggested_category).length,
    upgradedCandidates: productResult.upgradedCandidates,
    priceListItems: priceResult.items,
    rates: priceResult.rates,
  });
}

console.log(JSON.stringify({ mode: apply ? "applied" : "dry-run", projectRef, manifest: path.relative(process.cwd(), manifestPath), report }, null, 2));
