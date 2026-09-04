"use client";

import type {
  ReplacementBaselineStatus,
  ReplacementConfirmationInput,
  ReplacementDatePrecision,
  ReplacementEvidenceInput,
  ReplacementFollowUpAction,
  ReplacementReportedSource,
  ReplacementResponse,
  ReplacementTrackingCategory,
} from "@/lib/service-replacement-history";

export type ReplacementTrackingItem = {
  vendorProductId: string;
  lineItemIds: string[];
  productName: string;
  category: ReplacementTrackingCategory;
  categoryLabel: string;
  suggestedFacility: string | null;
  baselines: Array<{ facility: string; status: ReplacementBaselineStatus; replacementDate: string | null }>;
};

export type ReplacementTrackingReview = {
  items: ReplacementTrackingItem[];
  facilities: string[];
  alreadyAnswered: boolean;
};

export type ReplacementDraft = {
  vendorProductId: string;
  facility: string;
  response: ReplacementResponse | null;
  baselineStatus: ReplacementBaselineStatus | null;
  baselineDate: string;
  datePrecision: ReplacementDatePrecision;
  replacementDate: string;
  quantity: string;
  source: ReplacementReportedSource;
  notes: string;
  evidence: ReplacementEvidenceInput | null;
  followUpAction: ReplacementFollowUpAction | null;
};

const RESPONSE_OPTIONS: Array<{ value: ReplacementResponse; label: string }> = [
  { value: "replaced", label: "Replaced" },
  { value: "not_replaced", label: "Not replaced" },
  { value: "not_sure", label: "Not sure" },
  { value: "dont_track", label: "Don’t track" },
];

const BASELINE_OPTIONS: Array<{ value: ReplacementBaselineStatus; label: string }> = [
  { value: "last_replaced", label: "Last replaced" },
  { value: "approximately_replaced", label: "Approximately replaced" },
  { value: "never_replaced", label: "Never replaced" },
  { value: "unknown", label: "Unknown" },
];

export function createReplacementDrafts(items: ReplacementTrackingItem[]): ReplacementDraft[] {
  return items.map(item => ({
    vendorProductId: item.vendorProductId,
    facility: item.suggestedFacility ?? "",
    response: null,
    baselineStatus: null,
    baselineDate: "",
    datePrecision: "exact",
    replacementDate: "",
    quantity: "",
    source: "unknown",
    notes: "",
    evidence: null,
    followUpAction: null,
  }));
}

export function replacementDraftHasBaseline(item: ReplacementTrackingItem, draft: ReplacementDraft): boolean {
  const facility = draft.facility.trim().toLowerCase();
  return !!facility && item.baselines.some(baseline => baseline.facility.trim().toLowerCase() === facility);
}

export function replacementDraftsComplete(items: ReplacementTrackingItem[], drafts: ReplacementDraft[]): boolean {
  return items.every(item => {
    const draft = drafts.find(value => value.vendorProductId === item.vendorProductId);
    if (!draft?.response || !draft.facility.trim()) return false;
    if (draft.response === "dont_track") return true;
    if (!replacementDraftHasBaseline(item, draft)) {
      if (!draft.baselineStatus) return false;
      if (["last_replaced", "approximately_replaced"].includes(draft.baselineStatus) && !draft.baselineDate) return false;
    }
    if (draft.response === "replaced") {
      if (draft.datePrecision !== "unknown" && !draft.replacementDate) return false;
      if (!draft.quantity || Number(draft.quantity) <= 0) return false;
    }
    return true;
  });
}

export function toReplacementConfirmationInputs(items: ReplacementTrackingItem[], drafts: ReplacementDraft[]): ReplacementConfirmationInput[] {
  return items.map(item => {
    const draft = drafts.find(value => value.vendorProductId === item.vendorProductId)!;
    const needsBaseline = draft.response !== "dont_track" && !replacementDraftHasBaseline(item, draft);
    return {
      vendorProductId: item.vendorProductId,
      response: draft.response!,
      facility: draft.facility.trim(),
      baseline: needsBaseline && draft.baselineStatus ? {
        status: draft.baselineStatus,
        replacementDate: ["last_replaced", "approximately_replaced"].includes(draft.baselineStatus) ? draft.baselineDate : null,
      } : null,
      replacement: draft.response === "replaced" ? {
        datePrecision: draft.datePrecision,
        replacementDate: draft.datePrecision === "unknown" ? null : draft.replacementDate,
        quantity: Number(draft.quantity),
        facility: draft.facility.trim(),
        source: draft.source,
        notes: draft.notes.trim() || null,
        evidence: draft.evidence,
      } : null,
      followUpAction: draft.response === "not_sure" ? draft.followUpAction : null,
    };
  });
}

export default function ServiceReplacementConfirmation({
  tracking,
  drafts,
  onChange,
  disabled,
}: {
  tracking: ReplacementTrackingReview;
  drafts: ReplacementDraft[];
  onChange: (drafts: ReplacementDraft[]) => void;
  disabled: boolean;
}) {
  if (tracking.items.length === 0 || tracking.alreadyAnswered) return null;

  function update(vendorProductId: string, values: Partial<ReplacementDraft>) {
    onChange(drafts.map(draft => draft.vendorProductId === vendorProductId ? { ...draft, ...values } : draft));
  }

  async function attachEvidence(vendorProductId: string, file: File | null) {
    if (!file) return update(vendorProductId, { evidence: null });
    if (file.size > 5 * 1024 * 1024) return;
    const base64 = await fileToBase64(file);
    update(vendorProductId, { evidence: { name: file.name, mediaType: file.type, size: file.size, base64 } });
  }

  return (
    <div className="mt-6 rounded-2xl border-2 border-blue/25 bg-blue-pale/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-teal">Pro service history</div>
          <h3 className="mt-1 font-serif text-xl text-navy">Were any tracked items physically replaced?</h3>
          <p className="mt-1 max-w-3xl font-sans text-xs leading-5 text-gray-600">
            Answer for this service or billing period. Routine mat cleaning or scheduled exchange is not a physical replacement. A missing invoice charge is never treated as proof either way.
          </p>
        </div>
        <span className="rounded-full bg-teal px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-white">Pro</span>
      </div>

      <datalist id="replacement-facilities">
        {tracking.facilities.map(facility => <option key={facility} value={facility} />)}
      </datalist>

      <div className="mt-5 flex flex-col gap-4">
        {tracking.items.map(item => {
          const draft = drafts.find(value => value.vendorProductId === item.vendorProductId);
          if (!draft) return null;
          const hasBaseline = replacementDraftHasBaseline(item, draft);
          return (
            <div key={item.vendorProductId} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="font-sans text-sm font-semibold text-navy">{item.productName}</div>
                  <div className="font-sans text-xs text-gray-500">{item.categoryLabel}</div>
                </div>
                <label className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Facility
                  <input
                    list="replacement-facilities"
                    value={draft.facility}
                    disabled={disabled}
                    onChange={event => update(item.vendorProductId, { facility: event.target.value, baselineStatus: null, baselineDate: "" })}
                    placeholder="Facility name"
                    className="mt-1 block w-full min-w-52 rounded-lg border border-gray-300 px-3 py-2 font-sans text-sm font-normal normal-case tracking-normal text-navy outline-none focus:border-blue"
                  />
                </label>
              </div>

              {!hasBaseline && draft.response !== "dont_track" && (
                <div className="mt-4 rounded-lg border border-amber/30 bg-amber/5 p-3">
                  <div className="font-sans text-xs font-semibold text-navy">First tracked invoice: establish a starting point</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {BASELINE_OPTIONS.map(option => <ChoiceButton key={option.value} active={draft.baselineStatus === option.value} disabled={disabled} onClick={() => update(item.vendorProductId, { baselineStatus: option.value })}>{option.label}</ChoiceButton>)}
                  </div>
                  {(draft.baselineStatus === "last_replaced" || draft.baselineStatus === "approximately_replaced") && (
                    <label className="mt-3 block max-w-xs font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      {draft.baselineStatus === "approximately_replaced" ? "Approximate date" : "Last replaced date"}
                      <input type="date" value={draft.baselineDate} disabled={disabled} onChange={event => update(item.vendorProductId, { baselineDate: event.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 font-sans text-sm font-normal text-navy outline-none focus:border-blue" />
                    </label>
                  )}
                </div>
              )}

              <div className="mt-4 font-sans text-xs font-semibold text-navy">During this period:</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {RESPONSE_OPTIONS.map(option => <ChoiceButton key={option.value} active={draft.response === option.value} disabled={disabled} onClick={() => update(item.vendorProductId, { response: option.value, followUpAction: null })}>{option.label}</ChoiceButton>)}
              </div>

              {draft.response === "replaced" && (
                <div className="mt-4 grid gap-3 rounded-lg bg-off-white p-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500">Replacement date</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(["exact", "approximate", "unknown"] as ReplacementDatePrecision[]).map(value => <ChoiceButton key={value} active={draft.datePrecision === value} disabled={disabled} onClick={() => update(item.vendorProductId, { datePrecision: value, ...(value === "unknown" ? { replacementDate: "" } : {}) })}>{value === "exact" ? "Exact date" : value === "approximate" ? "Approximate date" : "Date unknown"}</ChoiceButton>)}
                    </div>
                  </div>
                  {draft.datePrecision !== "unknown" && <Field label={draft.datePrecision === "approximate" ? "Approximate date" : "Date replaced"}><input type="date" value={draft.replacementDate} disabled={disabled} onChange={event => update(item.vendorProductId, { replacementDate: event.target.value })} className={inputClass} /></Field>}
                  <Field label="Quantity replaced"><input type="number" min="0.01" step="any" value={draft.quantity} disabled={disabled} onChange={event => update(item.vendorProductId, { quantity: event.target.value })} className={inputClass} /></Field>
                  <Field label="Source"><select value={draft.source} disabled={disabled} onChange={event => update(item.vendorProductId, { source: event.target.value as ReplacementReportedSource })} className={inputClass}><option value="vendor">Vendor</option><option value="facility_manager">Facility manager</option><option value="customer">Customer</option><option value="service_record">Service record</option><option value="other">Other</option><option value="unknown">Unknown</option></select></Field>
                  <Field label="Notes (optional)"><textarea value={draft.notes} maxLength={2000} disabled={disabled} onChange={event => update(item.vendorProductId, { notes: event.target.value })} rows={3} className={inputClass} /></Field>
                  <label className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500 sm:col-span-2">
                    Evidence (optional, up to 5 MB)
                    <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={disabled} onChange={event => void attachEvidence(item.vendorProductId, event.target.files?.[0] ?? null)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-sans text-xs font-normal normal-case tracking-normal text-navy" />
                    {draft.evidence && <span className="mt-1 block normal-case tracking-normal text-teal">Attached: {draft.evidence.name}</span>}
                  </label>
                </div>
              )}

              {draft.response === "not_sure" && (
                <div className="mt-4 rounded-lg border border-blue/20 bg-blue-pale/30 p-3">
                  <div className="font-sans text-xs text-gray-700">Create a follow-up so this uncertainty does not get mistaken for “not replaced.”</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <ChoiceButton active={draft.followUpAction === "ask_vendor"} disabled={disabled} onClick={() => update(item.vendorProductId, { followUpAction: "ask_vendor" })}>Ask the vendor</ChoiceButton>
                    <ChoiceButton active={draft.followUpAction === "assign_facility_manager"} disabled={disabled} onClick={() => update(item.vendorProductId, { followUpAction: "assign_facility_manager" })}>Assign to facility manager</ChoiceButton>
                  </div>
                </div>
              )}

              {draft.response === "dont_track" && <div className="mt-3 font-sans text-xs text-gray-600">Tracking will be turned off for this item at this facility.</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChoiceButton({ active, disabled, onClick, children }: { active: boolean; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`rounded-lg border px-3 py-2 font-sans text-xs font-medium transition-colors disabled:opacity-50 ${active ? "border-blue bg-blue text-white" : "border-gray-300 bg-white text-navy hover:border-blue"}`}>{children}</button>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}{children}</label>;
}

const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-sans text-sm font-normal normal-case tracking-normal text-navy outline-none focus:border-blue";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read evidence file."));
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.readAsDataURL(file);
  });
}
