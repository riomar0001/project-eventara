'use client';

import { useState } from 'react';
import { Mail, CheckCircle2, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Authentication } from '@/api/sdk.gen';

interface VerifyEmailCardProps {
  email: string;
  onBack: () => void;
}

export function VerifyEmailCard({ email, onBack }: VerifyEmailCardProps) {
  const [resendState, setResendState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  async function handleResend() {
    setResendState('loading');
    const { error } = await Authentication.resendVerificationAuthResendVerificationPost({
      body: { email },
      throwOnError: false
    });
    setResendState(error ? 'error' : 'sent');
  }

  return (
    <Card className="gap-0 overflow-hidden py-0" style={{ animation: 'step-enter-forward 0.3s ease both' }}>
      {/* Hero */}
      <div className="flex flex-col items-center gap-5 px-8 pb-6 pt-10">
        {/* Pulsing icon */}
        <div className="relative flex items-center justify-center">
          <div
            className="absolute h-24 w-24 rounded-full bg-primary/10"
            style={{ animation: 'ping 2.5s cubic-bezier(0,0,0.2,1) infinite' }}
          />
          <div className="absolute h-18 w-18 rounded-full bg-primary/10" />
          <div className="bg-primary/15 border-primary/25 relative flex h-14 w-14 items-center justify-center rounded-full border-2">
            <Mail className="text-primary h-6 w-6" strokeWidth={1.5} />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-1.5 text-center">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">Check your inbox</h2>
          <p className="text-muted-foreground text-sm">We sent a verification link to</p>
        </div>

        {/* Email chip */}
        <div className="bg-muted border-border flex w-full items-center gap-3 rounded-xl border px-4 py-3">
          <div className="bg-primary/15 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
            <Mail className="text-primary h-3.5 w-3.5" />
          </div>
          <span className="text-foreground truncate text-sm font-medium">{email}</span>
        </div>

        <p className="text-muted-foreground/70 text-center text-xs">
          Can&apos;t find it? Check your spam or junk folder.
        </p>
      </div>

      <div className="border-border border-t" />

      {/* Actions */}
      <div className="flex flex-col gap-3 px-8 py-6">
        {resendState === 'sent' && (
          <div
            className="border-primary/20 bg-primary/5 flex items-center gap-3 rounded-lg border px-4 py-3"
            style={{ animation: 'step-enter-forward 0.25s ease both' }}
          >
            <CheckCircle2 className="text-primary h-4 w-4 shrink-0" />
            <p className="text-foreground text-sm font-medium">Email resent successfully.</p>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={handleResend}
          disabled={resendState === 'loading'}
          className="w-full gap-2"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${resendState === 'loading' ? 'animate-spin' : ''}`} />
          {resendState === 'loading' ? 'Resending…' : 'Resend verification email'}
        </Button>

        {resendState === 'error' && (
          <p className="text-destructive text-center text-xs">Failed to resend. Please try again.</p>
        )}

        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Wrong email? Go back
        </button>
      </div>
    </Card>
  );
}
