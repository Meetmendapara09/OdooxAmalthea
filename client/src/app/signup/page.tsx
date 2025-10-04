import { SignupForm } from '@/components/auth/signup-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScanLine } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2">
            <ScanLine className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold font-headline text-primary">ExpensEasy</h1>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Create your Account</CardTitle>
            <CardDescription>Join ExpensEasy and streamline your expense management.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
