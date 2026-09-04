export const FREE_AGREEMENT_PREVIEW_ALLOWANCE = 1;
export const PRO_QUARTERLY_AGREEMENT_ALLOWANCE = 1;

export function isProAgreementPlan(plan: string | null | undefined): boolean {
  return plan === "pro" || plan === "pro-annual";
}

export function agreementAllowance(plan: string | null | undefined): number {
  return isProAgreementPlan(plan) ? PRO_QUARTERLY_AGREEMENT_ALLOWANCE : FREE_AGREEMENT_PREVIEW_ALLOWANCE;
}

export function agreementAllowanceReached(plan: string | null | undefined, used: number | null | undefined): boolean {
  return Math.max(0, used ?? 0) >= agreementAllowance(plan);
}

export function startOfUtcQuarter(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3, 1));
}
