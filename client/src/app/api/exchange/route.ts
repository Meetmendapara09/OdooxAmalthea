import { NextResponse } from 'next/server';

const DEFAULT_ENDPOINT = 'https://api.exchangerate-api.com/v4/latest';
const V6_ENDPOINT = 'https://v6.exchangerate-api.com/v6';

async function fetchRatesFromProvider(base: string) {
  const apiKey = process.env.EXCHANGE_API;
  if (apiKey) {
    const res = await fetch(`${V6_ENDPOINT}/${apiKey}/latest/${encodeURIComponent(base)}`, { next: { revalidate: 60 * 10 } });
    if (res.ok) {
      const data = await res.json();
      if (data?.conversion_rates) {
        return data.conversion_rates as Record<string, number>;
      }
      if (data?.rates) {
        return data.rates as Record<string, number>;
      }
    }
  }

  const fallbackRes = await fetch(`${DEFAULT_ENDPOINT}/${encodeURIComponent(base)}`, { next: { revalidate: 60 * 5 } });
  if (!fallbackRes.ok) {
    throw new Error('Unable to fetch exchange rates');
  }
  const fallbackData = await fallbackRes.json();
  if (fallbackData?.conversion_rates) {
    return fallbackData.conversion_rates as Record<string, number>;
  }
  return fallbackData?.rates as Record<string, number>;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const base = searchParams.get('base');
  if (!base) {
    return NextResponse.json({ error: 'Missing base currency' }, { status: 400 });
  }

  try {
    const rates = await fetchRatesFromProvider(base.toUpperCase());
    return NextResponse.json({ base: base.toUpperCase(), rates }, { status: 200 });
  } catch (error: any) {
    console.error('Exchange API error', error);
    return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 502 });
  }
}
