'use client';

import { useRef, useCallback, useEffect, ChangeEvent, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '@/lib/utils';

export const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  focusedIndex: number;
  onFocusChange: (index: number) => void;
  hasError?: boolean;
}

function OtpCell({
  index,
  digit,
  isFocused,
  hasError,
  autoFocus,
  inputRef,
  onChange,
  onKeyDown,
  onFocus,
  onPaste
}: {
  index: number;
  digit: string;
  isFocused: boolean;
  hasError: boolean;
  autoFocus: boolean;
  inputRef: (el: HTMLInputElement | null) => void;
  onChange: (e: ChangeEvent<HTMLInputElement>, index: number) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>, index: number) => void;
  onFocus: (index: number) => void;
  onPaste: (e: ClipboardEvent<HTMLInputElement>) => void;
}) {
  const filled = digit !== '';

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]"
        maxLength={2}
        value={digit}
        autoFocus={autoFocus}
        autoComplete="one-time-code"
        onChange={(e) => onChange(e, index)}
        onKeyDown={(e) => onKeyDown(e, index)}
        onFocus={() => onFocus(index)}
        onPaste={onPaste}
        aria-label={`Digit ${index + 1}`}
        className={cn(
          'h-11 w-11 rounded-xl border-2 bg-transparent text-center text-xl font-semibold outline-none transition-all duration-200 select-none caret-transparent',
          hasError
            ? 'border-destructive text-destructive'
            : isFocused
              ? 'border-primary text-foreground shadow-[0_0_0_4px_oklch(0.841_0.238_128.85/0.15)]'
              : filled
                ? 'border-primary/40 text-foreground'
                : 'border-border text-foreground'
        )}
      />

    </div>
  );
}

export function OtpInput({ value, onChange, focusedIndex, onFocusChange, hasError = false }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setInputRef = useCallback(
    (index: number) => (el: HTMLInputElement | null) => {
      inputRefs.current[index] = el;
    },
    []
  );

  const focusCell = (index: number) => {
    const clamped = Math.max(0, Math.min(OTP_LENGTH - 1, index));
    inputRefs.current[clamped]?.focus();
  };

  // Select-all on focus so typing over an existing digit replaces it cleanly
  useEffect(() => {
    const el = inputRefs.current[focusedIndex];
    if (el) el.select();
  }, [focusedIndex]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) return;
    // Take only the last character typed (handles cases where browser inserts 2 chars)
    const digit = raw[raw.length - 1];
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (index < OTP_LENGTH - 1) focusCell(index + 1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (value[index] !== '') {
        const next = [...value];
        next[index] = '';
        onChange(next);
      } else if (index > 0) {
        const next = [...value];
        next[index - 1] = '';
        onChange(next);
        focusCell(index - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusCell(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusCell(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    onChange(next);
    focusCell(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  return (
    <div className="flex gap-2.5">
      {value.map((digit, i) => (
        <OtpCell
          key={i}
          index={i}
          digit={digit}
          isFocused={focusedIndex === i}
          hasError={hasError}
          autoFocus={i === 0}
          inputRef={setInputRef(i)}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocusChange}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}
