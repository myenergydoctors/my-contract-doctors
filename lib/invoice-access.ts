export const FREE_INVOICE_UPLOAD_ALLOWANCE = 1;
export const PRO_MONTHLY_INVOICE_UPLOAD_ALLOWANCE = 5;

export function isProInvoicePlan(plan: string | null | undefined): boolean {
  return plan === "pro" || plan === "pro-annual";
}

export function invoiceUploadAllowance(plan: string | null | undefined): number {
  return isProInvoicePlan(plan)
    ? PRO_MONTHLY_INVOICE_UPLOAD_ALLOWANCE
    : FREE_INVOICE_UPLOAD_ALLOWANCE;
}

export function invoiceAllowanceReached(
  plan: string | null | undefined,
  used: number | null | undefined,
): boolean {
  return Math.max(0, used ?? 0) >= invoiceUploadAllowance(plan);
}
