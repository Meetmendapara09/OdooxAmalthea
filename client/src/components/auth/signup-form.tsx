'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { Country } from '@/lib/definitions';
import { signIn } from 'next-auth/react';

export function SignupForm() {
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'manager' | 'employee'>('admin');

  const countryToCurrency = useMemo(() => {
    const map = new Map<string, { code: string; name: string; symbol: string }>();
    for (const c of countries) {
      const code = Object.keys(c.currencies ?? {})[0];
      if (code) {
        const details = (c.currencies as any)[code];
        map.set(c.name.common, { code, name: details?.name ?? code, symbol: details?.symbol ?? code });
      }
    }
    return map;
  }, [countries]);

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,currencies')
      .then((res) => res.json())
      .then((data) => {
        const sortedCountries = data
          .filter((country: Country) => country.currencies && Object.keys(country.currencies).length > 0)
          .sort((a: Country, b: Country) => a.name.common.localeCompare(b.name.common));
        setCountries(sortedCountries);
        if (!selectedCountry && sortedCountries.length > 0) {
          setSelectedCountry(sortedCountries[0].name.common);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch countries:', error);
        // Provide a minimal USD fallback so signup still works offline
        const fallback: Country[] = [
          { name: { common: 'United States' }, currencies: { USD: { name: 'United States dollar', symbol: '$' } } },
        ];
        setCountries(fallback);
        setSelectedCountry('United States');
        setIsLoading(false);
      });
  }, []);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const companyName = String(form.get('companyName'));
    const name = String(form.get('name'));
    const email = String(form.get('email'));
    const password = String(form.get('password'));
  const countryName = selectedCountry || String(form.get('country') || 'United States');

    const currency = countryToCurrency.get(countryName);
    if (!currency) return;

    if (selectedRole !== 'admin') {
      alert('Only admins can create a new company. Please contact your administrator to join an existing organization.');
      return;
    }

    try {
      // 1) Create company (ensures currency exists)
      const companyRes = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName,
          currencyCode: currency.code,
          currencyName: currency.name,
          currencySymbol: currency.symbol,
          isInitialAdmin: true,
        }),
      });
      if (!companyRes.ok) throw new Error(await companyRes.text());
      const company = await companyRes.json();

      // 2) Create user for that company with selected role
      const signupRes = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, companyId: company.id, role: selectedRole }),
      });
      if (!signupRes.ok) throw new Error(await signupRes.text());

      // 3) Sign in automatically
      const signInRes = await signIn('credentials', { email, password, redirect: false, callbackUrl: '/dashboard' });
      if (signInRes?.ok) {
        router.push('/dashboard');
      } else if (signInRes?.error) {
        alert('Signup successful but auto-login failed. Please login manually.');
        router.push('/login');
      }
    } catch (e) {
      console.error('Signup failed', e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
  <Input id="companyName" name="companyName" placeholder="Innovate Inc." required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Your Name</Label>
  <Input id="name" name="name" placeholder="Alex Doe" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
  <Input id="email" name="email" type="email" placeholder="m@example.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
  <Input id="password" name="password" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Your Role</Label>
        <Select name="role" required value={selectedRole} onValueChange={(val: any) => setSelectedRole(val)}>
          <SelectTrigger id="role">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin - Full access to manage company</SelectItem>
            <SelectItem value="manager" disabled>
              Manager - Invite only (ask your admin)
            </SelectItem>
            <SelectItem value="employee" disabled>
              Employee - Invite only (ask your admin)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-muted-foreground">
        Only admins can create a new company. Team members should request an invitation from their admin.
      </p>
      <div className="space-y-2">
        <Label htmlFor="country">Country (for default currency)</Label>
        <Select name="country" required onValueChange={(val) => setSelectedCountry(val)}>
          <SelectTrigger id="country" disabled={isLoading}>
            <SelectValue placeholder={isLoading ? 'Loading countries...' : 'Select a country'} />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.name.common} value={country.name.common}>
                {country.name.common}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
        Create Account
      </Button>
    </form>
  );
}
