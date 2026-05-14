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

const labelCls = 'mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground';

export function PasswordForm() {
  const { form, show, saving, error, success, setValue, toggleShow, handleSubmit } = usePasswordForm();

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">Change password</h3>
        <p className="mt-1 text-sm text-muted-foreground">Use a strong, unique password you don&apos;t use elsewhere.</p>
      </div>

      {FIELDS.map(({ key, label }) => (
        <div key={key}>
          <label className={labelCls}>{label}</label>
          <div className="relative">
            <input type={show[key] ? 'text' : 'password'} value={form[key]} onChange={(e) => setValue(key, e.target.value)} required placeholder="••••••••" className={INPUT} />
            <button type="button" onClick={() => toggleShow(key)} className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted">
              {show[key] ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      ))}

      {error && <p className="text-[13px] text-destructive">{error}</p>}
      {success && <p className="text-[13px] text-primary">Password updated successfully!</p>}

      <div className="border-t border-border pt-4">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Update password'}
        </button>
      </div>
    </form>
  );
}
