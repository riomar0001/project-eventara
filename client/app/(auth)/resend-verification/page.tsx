'use client';

import { useState } from 'react';
import { Loader2, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  email: z.string().email('Please enter a valid email address')
});

type FormData = z.infer<typeof schema>;

export default function ResendVerificationPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' }
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch('/api/resend-verification', {
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
        <div className="bg-primary/10 mb-6 flex size-14 items-center justify-center rounded-full">
          <MailCheck className="text-primary size-6" />
        </div>
        <h1 className="text-foreground text-[1.75rem] font-bold tracking-tight">Email sent!</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          If <span className="text-foreground font-medium">{sentEmail}</span> has an unverified account, a new confirmation link is on its way. Check your spam
          folder if you don&apos;t see it.
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
          <p className="text-muted-foreground text-center text-sm">
            <Link href="/login" className="text-foreground font-medium hover:underline">
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
        <h1 className="text-foreground text-[1.75rem] font-bold tracking-tight">Resend confirmation</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">Enter your email and we&apos;ll send a new verification link.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium" htmlFor="email">
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
          {form.formState.errors.email && <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>}
        </div>

        <Button type="submit" variant="default" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? 'Sending…' : 'Send verification email'}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-sm">
        Already verified?{' '}
        <Link href="/login" className="text-foreground font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
