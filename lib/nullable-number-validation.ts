export function hasInvalidOptionalNumber(
  values: unknown[],
  options: { integer?: boolean; maxAbsolute: number },
): boolean {
  return values.some(value => {
    if (value == null) return false;
    if (typeof value !== "number" || !Number.isFinite(value)) return true;
    if (options.integer && !Number.isSafeInteger(value)) return true;
    return Math.abs(value) > options.maxAbsolute;
  });
}
