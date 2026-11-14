/** Fixed illustrative rates — mirrors ChipIn.quote()'s demo FX math for a live preview. */
const DEMO_FX_RATES: Record<string, number> = { EUR: 1, GBP: 0.87, USD: 1.08 };

export interface DemoQuote {
  sourceMinorUnits: number;
  sourceCurrency: string;
  payMinorUnits: number;
  payCurrency: string;
  rate: number;
}

/**
 * A live preview only — never authoritative. The server independently recomputes and
 * enforces this via `ChipIn.quote()` at submit time, so a stale or tampered preview can't
 * change what's actually charged.
 */
export function demoQuote(
  priceMinorUnits: number,
  priceCurrency: string,
  currency: string,
  quantity: number,
): DemoQuote | null {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1_000_000) return null;
  if (!(currency in DEMO_FX_RATES) || !(priceCurrency in DEMO_FX_RATES)) return null;
  const sourceMinorUnits = priceMinorUnits * quantity;
  const rate = DEMO_FX_RATES[currency]! / DEMO_FX_RATES[priceCurrency]!;
  const payMinorUnits = Math.round(sourceMinorUnits * rate);
  if (
    !Number.isSafeInteger(sourceMinorUnits) ||
    !Number.isSafeInteger(payMinorUnits) ||
    payMinorUnits < 1
  ) {
    return null;
  }
  return { sourceMinorUnits, sourceCurrency: priceCurrency, payMinorUnits, payCurrency: currency, rate };
}
