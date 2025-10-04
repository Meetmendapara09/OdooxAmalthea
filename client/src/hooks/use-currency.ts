import { useEffect, useState } from 'react';
import { fetchExchangeRates } from '@/lib/currency';

export function useExchangeRates(base: string) {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchExchangeRates(base)
      .then((r) => {
        if (mounted) setRates(r);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [base]);
  return { rates, loading };
}
