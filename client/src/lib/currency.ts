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
    // Fallback to USD only
    const fallback: CountryCurrency[] = [{ country: 'United States', code: 'USD', name: 'United States dollar', symbol: '$' }];
    countriesCache = fallback;
    return fallback;
  }
}

export async function fetchExchangeRates(base: string): Promise<Record<string, number>> {
  const now = Date.now();
  if (ratesCache && ratesCache.base === base && now - ratesCache.timestamp < 15 * 60_000) {
    return ratesCache.rates;
  }
  try {
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${encodeURIComponent(base)}`);
    if (!res.ok) throw new Error('rate fetch failed');
    const json = await res.json();
    const rates = json.rates as Record<string, number>;
    ratesCache = { base, timestamp: now, rates };
    return rates;
  } catch {
    // Graceful fallback: identity rate for base
    const rates = { [base]: 1 } as Record<string, number>;
    ratesCache = { base, timestamp: now, rates };
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
