// Currency and exchange utilities
export type CountryCurrency = { country: string; code: string; name: string; symbol: string };

let countriesCache: CountryCurrency[] | null = null;
let ratesCache: { base: string; timestamp: number; rates: Record<string, number> } | null = null;

export async function fetchCountriesAndCurrencies(): Promise<CountryCurrency[]> {
  if (countriesCache) return countriesCache;
  try {
    const res = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
    const data = await res.json();
    const rows: CountryCurrency[] = [];
    for (const c of data) {
      if (!c.currencies) continue;
      const codes = Object.keys(c.currencies);
      if (codes.length === 0) continue;
      const code = codes[0];
      const cur = c.currencies[code];
      rows.push({ country: c.name.common, code, name: cur?.name ?? code, symbol: cur?.symbol ?? code });
    }
    rows.sort((a, b) => a.country.localeCompare(b.country));
    countriesCache = rows;
    return rows;
  } catch {
    // Fallback to INR only
    const fallback: CountryCurrency[] = [{ country: 'India', code: 'INR', name: 'Indian Rupee', symbol: '₹' }];
    countriesCache = fallback;
    return fallback;
  }
}

export async function fetchExchangeRates(base: string): Promise<Record<string, number>> {
  const upperBase = base.toUpperCase();
  const now = Date.now();
  if (ratesCache && ratesCache.base === upperBase && now - ratesCache.timestamp < 15 * 60_000) {
    return ratesCache.rates;
  }
  try {
    const res = await fetch(`/api/exchange?base=${encodeURIComponent(upperBase)}`);
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const json = await res.json();
    const rates = (json?.rates ?? {}) as Record<string, number>;
    ratesCache = { base: upperBase, timestamp: now, rates };
    return rates;
  } catch (error) {
    console.error('Exchange rate fetch failed, using fallback rate map', error);
    const rates = { [upperBase]: 1 } as Record<string, number>;
    ratesCache = { base: upperBase, timestamp: now, rates };
    return rates;
  }
}

export function convert(amount: number, from: string, to: string, rates: Record<string, number>): number {
  if (from === to) return amount;
  const toRate = rates[to];
  if (!toRate) return amount; // fallback if target rate missing
  // Rates are expressed as 1 base -> X target; when base !== from, callers should fetch rates for 'from'
  return amount * toRate;
}
