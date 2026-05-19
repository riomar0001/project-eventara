'use client';

import { Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { usePasswordForm } from '@/hooks/profile/use-password-form';

type FieldKey = 'current' | 'next' | 'confirm';

const FIELDS: { key: FieldKey; label: string }[] = [
  { key: 'current', label: 'Current password' },
  { key: 'next', label: 'New password' },
  { key: 'confirm', label: 'Confirm new password' }
];

const INPUT =
  'w-full rounded-xl border border-border bg-background px-4 py-3 pr-11 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none';
const INPUT_ERROR =
  'w-full rounded-xl border border-destructive bg-background px-4 py-3 pr-11 text-foreground placeholder-muted-foreground transition-all focus:border-destructive focus:ring-2 focus:ring-destructive/10 focus:outline-none';

const labelCls = 'mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground';

export function PasswordForm() {
  const { form, show, saving, error, errors, success, setValue, toggleShow, handleSubmit } = usePasswordForm();

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-5">
      <div>
        <h3 className="text-foreground text-base font-semibold">Change password</h3>
        <p className="text-muted-foreground mt-1 text-sm">Use a strong, unique password you don&apos;t use elsewhere.</p>
      </div>

      {FIELDS.map(({ key, label }) => (
        <div key={key}>
          <label className={labelCls}>{label}</label>
          <div className="relative">
            <input
              type={show[key] ? 'text' : 'password'}
              value={form[key]}
              onChange={(e) => setValue(key, e.target.value)}
              required
              placeholder="••••••••"
              className={errors[key] ? INPUT_ERROR : INPUT}
            />
            <button
              type="button"
              onClick={() => toggleShow(key)}
              className="text-muted-foreground hover:bg-muted absolute top-1/2 right-3.5 -translate-y-1/2 rounded-lg p-1 transition-colors"
            >
              {show[key] ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors[key] && <p className="text-destructive mt-1.5 text-[13px]">{errors[key]}</p>}
        </div>
      ))}

      {error && <p className="text-destructive text-[13px]">{error}</p>}
      {success && <p className="text-primary text-[13px]">Password updated successfully!</p>}

      <div className="border-border border-t pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-primary-foreground flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Update password'}
        </button>
      </div>
    </form>
  );
}
