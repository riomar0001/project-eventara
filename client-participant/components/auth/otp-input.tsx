import type { RefObject } from 'react';

type Props = {
  digits: string[];
  inputRefs: RefObject<(HTMLInputElement | null)[]>;
  onChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent) => void;
};

export function OtpInput({ digits, inputRefs, onChange, onKeyDown, onPaste }: Props) {
  return (
    <div className="flex justify-center gap-3">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          className="border-line-soft bg-page text-text focus:border--lime h-14 w-12 rounded-xl border text-center text-xl font-bold transition-all focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
        />
      ))}
    </div>
  );
}
