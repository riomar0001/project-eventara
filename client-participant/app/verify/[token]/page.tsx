'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Auth } from '@/api/sdk.gen';
import { MeshBg } from '@/components/shared/mesh-bg';
import Link from 'next/link';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmailPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    Auth.verifyEmailAuthVerifyTokenGet({ path: { token: params.token } }).then(({ error: apiError }) => {
      if (apiError) {
        const msg = (apiError as { message?: string } | null)?.message;
        setMessage(msg ?? 'This verification link has expired or has already been used.');
        setStatus('error');
      } else {
        setStatus('success');
        setTimeout(() => router.replace('/login'), 3000);
      }
    });
  }, [params.token, router]);

  return (
    <main className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <MeshBg />
      <div className="relative z-10 w-full max-w-sm text-center">
        <div className="border-border bg-card rounded-3xl border px-8 py-10 shadow-2xl">
          {status === 'loading' && (
            <>
              <Loader2 size={40} className="text-primary mx-auto mb-5 animate-spin" />
              <h2 className="text-foreground text-xl font-bold tracking-[-0.02em]">Verifying your email…</h2>
              <p className="text-muted-foreground mt-2 text-[13.5px]">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="bg-primary/10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
                <CheckCircle2 size={32} className="text-primary" />
              </div>
              <h2 className="text-foreground text-xl font-bold tracking-[-0.02em]">Email verified!</h2>
              <p className="text-muted-foreground mt-2 text-[13.5px]">Your account is active. Redirecting you to sign in…</p>
              <Link
                href="/login"
                className="bg-primary text-primary-foreground mt-6 inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow)] transition-all hover:-translate-y-0.5"
              >
                Sign in now
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="bg-destructive/10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
                <XCircle size={32} className="text-destructive" />
              </div>
              <h2 className="text-foreground text-xl font-bold tracking-[-0.02em]">Verification failed</h2>
              <p className="text-muted-foreground mt-2 text-[13.5px]">{message}</p>
              <Link
                href="/login"
                className="text-primary mt-6 inline-block text-[13.5px] font-semibold transition-colors hover:underline"
              >
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
