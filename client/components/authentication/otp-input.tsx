'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OTPInput({ value, onChange, disabled }: OTPInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex gap-2.5"
      onClick={() => !disabled && inputRef.current?.focus()}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex h-12 w-10 cursor-text items-center justify-center rounded-xl border-2 text-lg font-semibold transition-all select-none',
            value[i]
              ? 'border-primary/60 bg-primary/5 text-foreground'
              : 'border-border bg-muted/40 text-muted-foreground/30',
            i === value.length && !disabled && 'border-primary ring-3 ring-primary/15',
            disabled && 'pointer-events-none opacity-50'
          )}
        >
          {value[i] ?? '·'}
        </div>
      ))}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        aria-label="One-time password"
        className="sr-only"
      />
    </div>
  );
}
