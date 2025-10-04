'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export function LoginForm() {
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    const res = await signIn('credentials', { email, password, redirect: false, callbackUrl: '/dashboard' });
    if (res?.ok) {
      router.push('/dashboard');
    } else if (res?.error) {
      alert('Login failed: ' + res.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
  <Input id="email" name="email" type="email" placeholder="m@example.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
  <Input id="password" name="password" type="password" required />
      </div>
      <div className="flex justify-end">
        <a href="/forgot-password" className="text-sm text-accent hover:underline">
          Forgot password?
        </a>
      </div>
      <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
        Log In
      </Button>
    </form>
  );
}
