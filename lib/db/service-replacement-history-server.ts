import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isProInvoicePlan } from "@/lib/invoice-access";
import {
  isExplicitlyEligibleProduct,
  isReplacementTrackingCategory,
  REPLACEMENT_CATEGORY_LABELS,
  replacementFactsForConfirmation,
  summarizeBilledActivitySince,
  validateReplacementConfirmation,
  type BilledLineForReplacement,
  type ReplacementBaselineStatus,
  type ReplacementConfirmationInput,
  type ReplacementDatePrecision,
  type ReplacementTrackingCategory,
} from "@/lib/service-replacement-history";

export class ServiceReplacementError extends Error {
  constructor(message: string, public readonly status: number, public readonly code: string) {
    super(message);
  }
}

type InvoiceContext = {
  id: string;
  userId: string;
  organizationId: string;
  locationId: string | null;
  facilityName: string | null;
};

type EligibleItem = {
  vendorProductId: string;
  lineItemIds: string[];
  productName: string;
  category: ReplacementTrackingCategory;
  categoryLabel: string;
  suggestedFacility: string | null;
  baselines: Array<{
    facility: string;
    status: ReplacementBaselineStatus;
    replacementDate: string | null;
  }>;
};

export type InvoiceReplacementHistoryDTO = {
  items: EligibleItem[];
  facilities: string[];
  alreadyAnswered: boolean;
};

async function loadInvoiceContext(invoiceId: string, userId: string): Promise<InvoiceContext> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("invoice_analyses")
    .select("id,user_id,organization_id,location_id")
    .eq("id", invoiceId)
    .maybeSingle();
  if (error) throw new ServiceReplacementError(error.message, 503, "service_history_schema_unavailable");
  if (!data) throw new ServiceReplacementError("Invoice not found.", 404, "not_found");
  const invoice = data as { id: string; user_id: string; organization_id: string | null; location_id: string | null };
  const organizationId = invoice.organization_id ?? invoice.user_id;

  if (invoice.user_id !== userId) {
    const { data: membership, error: membershipError } = await admin.from("organization_members")
      .select("user_id")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    if (membershipError) throw new ServiceReplacementError(membershipError.message, 503, "service_history_schema_unavailable");
    if (!membership) throw new ServiceReplacementError("You do not have access to this invoice.", 403, "forbidden");
  }

  const { data: profile, error: profileError } = await admin.from("profiles").select("plan").eq("id", userId).maybeSingle();
  if (profileError) throw new ServiceReplacementError(profileError.message, 503, "profile_unavailable");
  if (!isProInvoicePlan((profile as { plan?: string } | null)?.plan)) {
    throw new ServiceReplacementError("Service and replacement history is available on Pro.", 403, "pro_required");
  }

  let facilityName: string | null = null;
  if (invoice.location_id) {
    const { data: location } = await admin.from("locations").select("name").eq("id", invoice.location_id).maybeSingle();
    facilityName = (location as { name?: string } | null)?.name?.trim() || null;
  }
  return { id: invoice.id, userId: invoice.user_id, organizationId, locationId: invoice.location_id, facilityName };
}

async function listEligibleItems(context: InvoiceContext): Promise<EligibleItem[]> {
  const admin = createAdminClient();
  const { data: lineData, error: lineError } = await admin.from("invoice_line_items")
    .select("id,vendor_product_id,confirmed_description,raw_label,line_type,confirmed_line_type,review_status")
    .eq("invoice_id", context.id)
    .neq("review_status", "excluded")
    .not("vendor_product_id", "is", null);
  if (lineError) throw new ServiceReplacementError(lineError.message, 503, "service_history_schema_unavailable");
  const lines = ((lineData ?? []) as Array<{
    id: string;
    vendor_product_id: string;
    confirmed_description: string | null;
    raw_label: string;
    line_type: string | null;
    confirmed_line_type: string | null;
  }>).filter(line => (line.confirmed_line_type ?? line.line_type ?? "charge") === "charge");
  const ids = [...new Set(lines.map(line => line.vendor_product_id).filter(Boolean))];
  if (ids.length === 0) return [];

  const { data: productData, error: productError } = await admin.from("vendor_products")
    .select("id,display_name,catalog_status,replacement_tracking_eligibility,replacement_tracking_category,replacement_tracking_suggested_category")
    .in("id", ids);
  if (productError) throw new ServiceReplacementError(productError.message, 503, "service_history_schema_unavailable");

  const { data: baselineData, error: baselineError } = await admin.from("service_replacement_baselines")
    .select("vendor_product_id,facility_name,baseline_status,replacement_date")
    .eq("organization_id", context.organizationId)
    .in("vendor_product_id", ids);
  if (baselineError) throw new ServiceReplacementError(baselineError.message, 503, "service_history_schema_unavailable");

  const { data: preferenceData, error: preferenceError } = await admin.from("service_replacement_tracking_preferences")
    .select("vendor_product_id,facility_name,tracking_enabled")
    .eq("organization_id", context.organizationId)
    .in("vendor_product_id", ids)
    .eq("tracking_enabled", false);
  if (preferenceError) throw new ServiceReplacementError(preferenceError.message, 503, "service_history_schema_unavailable");

  const disabled = new Set(((preferenceData ?? []) as Array<{ vendor_product_id: string; facility_name: string }>).map(row => `${row.vendor_product_id}::${row.facility_name.trim().toLowerCase()}`));
  const baselines = (baselineData ?? []) as Array<{ vendor_product_id: string; facility_name: string; baseline_status: ReplacementBaselineStatus; replacement_date: string | null }>;
  const products = (productData ?? []) as Array<{
    id: string;
    display_name: string | null;
    catalog_status: string;
    replacement_tracking_eligibility: "unreviewed" | "eligible" | "ineligible";
    replacement_tracking_category: ReplacementTrackingCategory | null;
    replacement_tracking_suggested_category: ReplacementTrackingCategory | null;
  }>;

  return products.flatMap(product => {
    if (!isExplicitlyEligibleProduct({
      id: product.id,
      catalogStatus: product.catalog_status,
      eligibility: product.replacement_tracking_eligibility,
      category: product.replacement_tracking_category,
      suggestedCategory: product.replacement_tracking_suggested_category,
    })) return [];
    const matchingLines = lines.filter(line => line.vendor_product_id === product.id);
    const facilityKey = (context.facilityName || "").toLowerCase();
    if (facilityKey && disabled.has(`${product.id}::${facilityKey}`)) return [];
    const category = product.replacement_tracking_category as ReplacementTrackingCategory;
    return [{
      vendorProductId: product.id,
      lineItemIds: matchingLines.map(line => line.id),
      productName: product.display_name || matchingLines[0]?.confirmed_description || matchingLines[0]?.raw_label || REPLACEMENT_CATEGORY_LABELS[category],
      category,
      categoryLabel: REPLACEMENT_CATEGORY_LABELS[category],
      suggestedFacility: context.facilityName,
      baselines: baselines.filter(row => row.vendor_product_id === product.id).map(row => ({
        facility: row.facility_name,
        status: row.baseline_status,
        replacementDate: row.replacement_date,
      })),
    }];
  });
}

export async function getInvoiceReplacementHistory(invoiceId: string, userId: string): Promise<InvoiceReplacementHistoryDTO> {
  const context = await loadInvoiceContext(invoiceId, userId);
  const admin = createAdminClient();
  const [items, locationsResult, responseResult] = await Promise.all([
    listEligibleItems(context),
    admin.from("locations").select("name").eq("organization_id", context.organizationId).eq("is_active", true).order("name"),
    admin.from("service_replacement_invoice_responses").select("id,vendor_product_id,response").eq("invoice_id", invoiceId),
  ]);
  if (locationsResult.error) throw new ServiceReplacementError(locationsResult.error.message, 503, "service_history_schema_unavailable");
  if (responseResult.error) throw new ServiceReplacementError(responseResult.error.message, 503, "service_history_schema_unavailable");
  const answeredIds = new Set(((responseResult.data ?? []) as Array<{ vendor_product_id: string }>).map(row => row.vendor_product_id));
  const unansweredItems = items.filter(item => !answeredIds.has(item.vendorProductId));
  return {
    items: unansweredItems,
    facilities: ((locationsResult.data ?? []) as Array<{ name: string }>).map(row => row.name),
    alreadyAnswered: items.length > 0 && unansweredItems.length === 0,
  };
}

export async function saveInvoiceReplacementHistory(
  invoiceId: string,
  confirmations: ReplacementConfirmationInput[],
  userId: string,
): Promise<void> {
  const context = await loadInvoiceContext(invoiceId, userId);
  const eligibleItems = await listEligibleItems(context);
  if (eligibleItems.length === 0) return;
  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin.from("service_replacement_invoice_responses").select("id,vendor_product_id,response,facility_name").eq("invoice_id", invoiceId);
  if (existingError) throw new ServiceReplacementError(existingError.message, 503, "service_history_schema_unavailable");
  const existingByProduct = new Map(((existing ?? []) as Array<{ id: string; vendor_product_id: string; response: string; facility_name: string }>).map(row => [row.vendor_product_id, row]));

  const eligibleIds = new Set(eligibleItems.map(item => item.vendorProductId));
  const submittedIds = new Set(confirmations.map(item => item.vendorProductId));
  const coveredIds = new Set([...existingByProduct.keys(), ...submittedIds]);
  if (submittedIds.size !== confirmations.length || eligibleIds.size !== coveredIds.size || [...eligibleIds].some(id => !coveredIds.has(id))) {
    throw new ServiceReplacementError("Answer the replacement question for every eligible tracked item.", 400, "incomplete_replacement_confirmation");
  }

  for (const input of confirmations) {
    const eligible = eligibleItems.find(item => item.vendorProductId === input.vendorProductId);
    if (!eligible || !isReplacementTrackingCategory(eligible.category)) {
      throw new ServiceReplacementError("This product is not approved for replacement tracking.", 400, "ineligible_product");
    }
    const facility = input.facility.trim();
    const existingBaseline = eligible.baselines.some(row => row.facility.trim().toLowerCase() === facility.toLowerCase());
    const errors = validateReplacementConfirmation(input, !existingBaseline);
    if (errors.length > 0) throw new ServiceReplacementError(errors[0], 400, "invalid_replacement_confirmation");
    const facts = replacementFactsForConfirmation(input);

    if (!existingBaseline && facts.baseline) {
      const { error } = await admin.from("service_replacement_baselines").insert({
        organization_id: context.organizationId,
        vendor_product_id: eligible.vendorProductId,
        category: eligible.category,
        product_name: eligible.productName,
        facility_name: facility,
        baseline_status: facts.baseline.status,
        replacement_date: facts.baseline.replacementDate,
        source_invoice_id: invoiceId,
        established_by: userId,
      });
      if (error) throw new ServiceReplacementError(error.message, 503, "save_failed");
    }

    const existingResponse = existingByProduct.get(eligible.vendorProductId);
    if (existingResponse && (existingResponse.response !== facts.response || existingResponse.facility_name.trim().toLowerCase() !== facility.toLowerCase())) {
      throw new ServiceReplacementError("The saved replacement response does not match this confirmation.", 409, "replacement_response_conflict");
    }
    let responseId = existingResponse?.id;
    if (!responseId) {
      const { data: response, error: responseError } = await admin.from("service_replacement_invoice_responses").insert({
        organization_id: context.organizationId,
        invoice_id: invoiceId,
        vendor_product_id: eligible.vendorProductId,
        category: eligible.category,
        product_name: eligible.productName,
        facility_name: facility,
        response: facts.response,
        responded_by: userId,
      }).select("id").single();
      if (responseError || !response) throw new ServiceReplacementError(responseError?.message || "Could not save the replacement response.", 503, "save_failed");
      responseId = response.id;
    }

    if (facts.event) {
      const replacement = facts.event;
      const { data: savedEvent, error: eventLookupError } = await admin.from("service_replacement_events").select("id").eq("invoice_response_id", responseId).maybeSingle();
      if (eventLookupError) throw new ServiceReplacementError(eventLookupError.message, 503, "save_failed");
      let evidence: { path: string; name: string; type: string; size: number } | null = null;
      if (!savedEvent && replacement.evidence) {
        evidence = await uploadEvidence(context.organizationId, invoiceId, eligible.vendorProductId, replacement.evidence);
      }
      const { error } = savedEvent ? { error: null } : await admin.from("service_replacement_events").insert({
        organization_id: context.organizationId,
        vendor_product_id: eligible.vendorProductId,
        invoice_response_id: responseId,
        source_invoice_id: invoiceId,
        category: eligible.category,
        product_name: eligible.productName,
        replacement_date: replacement.datePrecision === "unknown" ? null : replacement.replacementDate,
        date_precision: replacement.datePrecision,
        quantity: replacement.quantity,
        facility_name: replacement.facility.trim(),
        reported_source: replacement.source,
        notes: replacement.notes?.trim() || null,
        evidence_path: evidence?.path ?? null,
        evidence_file_name: evidence?.name ?? null,
        evidence_media_type: evidence?.type ?? null,
        evidence_size_bytes: evidence?.size ?? null,
        confirmed_by: userId,
      });
      if (error) throw new ServiceReplacementError(error.message, 503, "save_failed");
    }

    if (facts.followUpAction) {
      const { error } = await admin.from("service_replacement_follow_ups").upsert({
        organization_id: context.organizationId,
        invoice_response_id: responseId,
        action_type: facts.followUpAction,
        assigned_label: facts.followUpAction === "ask_vendor" ? "Vendor" : "Facility manager",
        created_by: userId,
      }, { onConflict: "invoice_response_id,action_type", ignoreDuplicates: true });
      if (error) throw new ServiceReplacementError(error.message, 503, "save_failed");
    }

    if (facts.disablesTracking) {
      const { data: preferenceRows, error: preferenceLookupError } = await admin.from("service_replacement_tracking_preferences")
        .select("id,facility_name")
        .eq("organization_id", context.organizationId)
        .eq("vendor_product_id", eligible.vendorProductId);
      if (preferenceLookupError) throw new ServiceReplacementError(preferenceLookupError.message, 503, "save_failed");
      const preference = ((preferenceRows ?? []) as Array<{ id: string; facility_name: string }>).find(row => row.facility_name.trim().toLowerCase() === facility.toLowerCase());
      const values = {
        facility_name: facility,
        tracking_enabled: false,
        changed_by: userId,
        changed_at: new Date().toISOString(),
      };
      const { error } = preference
        ? await admin.from("service_replacement_tracking_preferences").update(values).eq("id", preference.id)
        : await admin.from("service_replacement_tracking_preferences").insert({
            organization_id: context.organizationId,
            vendor_product_id: eligible.vendorProductId,
            ...values,
          });
      if (error) throw new ServiceReplacementError(error.message, 503, "save_failed");
    }
  }
}

async function uploadEvidence(
  organizationId: string,
  invoiceId: string,
  vendorProductId: string,
  evidence: { name: string; mediaType: string; size: number; base64: string },
): Promise<{ path: string; name: string; type: string; size: number }> {
  const bytes = Buffer.from(evidence.base64, "base64");
  if (bytes.byteLength !== evidence.size || bytes.byteLength > 5 * 1024 * 1024) {
    throw new ServiceReplacementError("Evidence file size is invalid.", 400, "invalid_evidence");
  }
  const safeName = evidence.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "evidence";
  const path = `${organizationId}/${invoiceId}/${vendorProductId}/${crypto.randomUUID()}-${safeName}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from("replacement-evidence").upload(path, bytes, {
    contentType: evidence.mediaType,
    upsert: false,
  });
  if (error) throw new ServiceReplacementError(error.message, 503, "evidence_upload_failed");
  return { path, name: evidence.name, type: evidence.mediaType, size: bytes.byteLength };
}

type HistoryEventRow = {
  id: string;
  vendor_product_id: string;
  product_name: string;
  category: ReplacementTrackingCategory;
  replacement_date: string | null;
  date_precision: ReplacementDatePrecision;
  quantity: number | string | null;
  facility_name: string;
  reported_source: string;
  notes: string | null;
  evidence_file_name: string | null;
  confirmed_at: string;
};

export type ServiceReplacementHistoryItem = {
  key: string;
  vendorProductId: string;
  productName: string;
  category: ReplacementTrackingCategory;
  categoryLabel: string;
  facility: string;
  baseline: { status: ReplacementBaselineStatus; replacementDate: string | null } | null;
  lastReplacement: {
    date: string | null;
    precision: ReplacementDatePrecision;
    quantity: number | null;
    source: string;
    notes: string | null;
    evidenceFileName: string | null;
    confirmedAt: string;
  } | null;
  billedPeriodsSince: number;
  ongoingFeesCentsSince: number;
  openFollowUps: string[];
};

export async function getServiceReplacementHistory(userId: string): Promise<ServiceReplacementHistoryItem[]> {
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin.from("profiles").select("plan,default_organization_id").eq("id", userId).maybeSingle();
  if (profileError) throw new ServiceReplacementError(profileError.message, 503, "profile_unavailable");
  const typedProfile = profile as { plan?: string; default_organization_id?: string | null } | null;
  if (!isProInvoicePlan(typedProfile?.plan)) throw new ServiceReplacementError("Service and replacement history is available on Pro.", 403, "pro_required");
  const organizationId = typedProfile?.default_organization_id ?? userId;

  const [eventsResult, baselinesResult, followUpsResult] = await Promise.all([
    admin.from("service_replacement_events").select("id,vendor_product_id,product_name,category,replacement_date,date_precision,quantity,facility_name,reported_source,notes,evidence_file_name,confirmed_at").eq("organization_id", organizationId).order("confirmed_at", { ascending: false }),
    admin.from("service_replacement_baselines").select("vendor_product_id,facility_name,baseline_status,replacement_date,product_name,category").eq("organization_id", organizationId),
    admin.from("service_replacement_follow_ups").select("action_type,invoice_response_id,service_replacement_invoice_responses!inner(vendor_product_id,facility_name)").eq("organization_id", organizationId).eq("status", "open"),
  ]);
  for (const result of [eventsResult, baselinesResult, followUpsResult]) {
    if (result.error) throw new ServiceReplacementError(result.error.message, 503, "service_history_schema_unavailable");
  }

  const events = (eventsResult.data ?? []) as unknown as HistoryEventRow[];
  const baselines = (baselinesResult.data ?? []) as unknown as Array<{
    vendor_product_id: string;
    facility_name: string;
    baseline_status: ReplacementBaselineStatus;
    replacement_date: string | null;
    product_name: string;
    category: ReplacementTrackingCategory;
  }>;
  const keys = new Set<string>();
  events.forEach(row => keys.add(scopeKey(row.vendor_product_id, row.facility_name)));
  baselines.forEach(row => keys.add(scopeKey(row.vendor_product_id, row.facility_name)));
  if (keys.size === 0) return [];

  const productIds = [...new Set([...events.map(row => row.vendor_product_id), ...baselines.map(row => row.vendor_product_id)])];
  const { data: lineData, error: lineError } = await admin.from("invoice_line_items")
    .select("invoice_id,vendor_product_id,confirmed_line_total_cents,raw_line_total_cents,review_status")
    .eq("organization_id", organizationId)
    .in("vendor_product_id", productIds)
    .neq("review_status", "excluded");
  if (lineError) throw new ServiceReplacementError(lineError.message, 503, "service_history_schema_unavailable");
  const invoiceIds = [...new Set(((lineData ?? []) as Array<{ invoice_id: string }>).map(row => row.invoice_id))];
  const { data: invoiceData, error: invoiceError } = invoiceIds.length === 0
    ? { data: [], error: null }
    : await admin.from("invoice_analyses").select("id,review_status,period_start,period_end,invoice_date,reviewed_at,location_id").in("id", invoiceIds).eq("review_status", "confirmed");
  if (invoiceError) throw new ServiceReplacementError(invoiceError.message, 503, "service_history_schema_unavailable");
  const locationIds = [...new Set(((invoiceData ?? []) as Array<{ location_id: string | null }>).map(row => row.location_id).filter((id): id is string => !!id))];
  const { data: locationData } = locationIds.length === 0 ? { data: [] } : await admin.from("locations").select("id,name").in("id", locationIds);
  const locationNames = new Map(((locationData ?? []) as Array<{ id: string; name: string }>).map(row => [row.id, row.name]));
  const invoices = new Map(((invoiceData ?? []) as Array<{
    id: string; period_start: string | null; period_end: string | null; invoice_date: string | null; reviewed_at: string | null; location_id: string | null;
  }>).map(row => [row.id, row]));
  const billedLines = (lineData ?? []) as Array<{ invoice_id: string; vendor_product_id: string; confirmed_line_total_cents: number | null; raw_line_total_cents: number | null }>;
  const followUps = (followUpsResult.data ?? []) as unknown as Array<{
    action_type: string;
    service_replacement_invoice_responses: { vendor_product_id: string; facility_name: string } | null;
  }>;

  return [...keys].map(key => {
    const [vendorProductId, facilityLower] = key.split("::");
    const scopedEvents = events.filter(row => scopeKey(row.vendor_product_id, row.facility_name) === key);
    const latestEvent = scopedEvents[0] ?? null;
    const baselineRow = baselines.find(row => scopeKey(row.vendor_product_id, row.facility_name) === key) ?? null;
    const facility = latestEvent?.facility_name ?? baselineRow?.facility_name ?? facilityLower;
    const boundaryDate = latestEvent?.replacement_date ?? (
      baselineRow?.baseline_status === "last_replaced" || baselineRow?.baseline_status === "approximately_replaced"
        ? baselineRow.replacement_date
        : null
    );
    const boundaryConfirmedAt = latestEvent?.confirmed_at ?? `${boundaryDate || "9999-12-31"}T00:00:00Z`;
    const activity: BilledLineForReplacement[] = billedLines.flatMap(line => {
      if (line.vendor_product_id !== vendorProductId) return [];
      const invoice = invoices.get(line.invoice_id);
      if (!invoice) return [];
      const invoiceFacility = invoice.location_id ? locationNames.get(invoice.location_id) : null;
      if (invoiceFacility && invoiceFacility.trim().toLowerCase() !== facility.trim().toLowerCase()) return [];
      return [{
        invoiceId: line.invoice_id,
        periodKey: invoice.period_start || invoice.period_end ? `${invoice.period_start || "?"}:${invoice.period_end || "?"}` : line.invoice_id,
        effectiveDate: invoice.period_end ?? invoice.invoice_date ?? invoice.reviewed_at,
        lineTotalCents: line.confirmed_line_total_cents ?? line.raw_line_total_cents,
      }];
    });
    const billed = latestEvent || boundaryDate
      ? summarizeBilledActivitySince(activity, boundaryDate, boundaryConfirmedAt)
      : { billedPeriods: 0, ongoingFeesCents: 0 };
    const category = latestEvent?.category ?? baselineRow!.category;
    return {
      key,
      vendorProductId,
      productName: latestEvent?.product_name ?? baselineRow!.product_name,
      category,
      categoryLabel: REPLACEMENT_CATEGORY_LABELS[category],
      facility,
      baseline: baselineRow ? { status: baselineRow.baseline_status, replacementDate: baselineRow.replacement_date } : null,
      lastReplacement: latestEvent ? {
        date: latestEvent.replacement_date,
        precision: latestEvent.date_precision,
        quantity: latestEvent.quantity == null ? null : Number(latestEvent.quantity),
        source: latestEvent.reported_source,
        notes: latestEvent.notes,
        evidenceFileName: latestEvent.evidence_file_name,
        confirmedAt: latestEvent.confirmed_at,
      } : null,
      billedPeriodsSince: billed.billedPeriods,
      ongoingFeesCentsSince: billed.ongoingFeesCents,
      openFollowUps: followUps.filter(row => {
        const response = row.service_replacement_invoice_responses;
        return response && scopeKey(response.vendor_product_id, response.facility_name) === key;
      }).map(row => row.action_type),
    } satisfies ServiceReplacementHistoryItem;
  }).sort((left, right) => (right.lastReplacement?.confirmedAt || "").localeCompare(left.lastReplacement?.confirmedAt || ""));
}

function scopeKey(vendorProductId: string, facility: string): string {
  return `${vendorProductId}::${facility.trim().toLowerCase()}`;
}
