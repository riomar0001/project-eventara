'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  email: z.string().email('Please enter a valid email address')
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' }
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message ?? 'Something went wrong. Please try again.');
        return;
      }

      setSentEmail(data.email);
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Mail className="size-6 text-primary" />
        </div>
        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If <span className="font-medium text-foreground">{sentEmail}</span> is registered, you&apos;ll
          receive a password reset link shortly. Check your spam folder if you don&apos;t see it.
        </p>

        <div className="mt-8 space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setSent(false);
              form.reset();
            }}
          >
            Try a different email
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/auth/login" className="font-medium text-foreground hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">Forgot password?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!form.formState.errors.email}
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <Button type="submit" variant="black" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/auth/login" className="font-medium text-foreground hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
