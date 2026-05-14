'use client';

import { Loader2, RotateCcw, Save } from 'lucide-react';
import { useProfileForm } from '@/hooks/profile/use-profile-form';
import { AGE_GROUPS, GENDERS, EDUCATION_LEVELS } from '@/constants/profile';

const INPUT =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none';

const labelCls = 'mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground';

export function ProfileForm() {
  const { form, saving, saved, setField, reset, handleSubmit } = useProfileForm();

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <p className="mb-3 font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">Profile picture</p>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
            {(form.firstName[0] ?? 'U').toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Upload a photo</p>
            <p className="mt-0.5 text-xs text-muted-foreground">JPG or PNG · max 2 MB</p>
          </div>
          <button type="button" className="shrink-0 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-muted-foreground">
            Choose file
          </button>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>First name</label>
          <input className={INPUT} value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} placeholder="Alex" />
        </div>
        <div>
          <label className={labelCls}>Last name</label>
          <input className={INPUT} value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} placeholder="Rivera" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Alias</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">@</span>
          <input className={`${INPUT} pl-8`} value={form.alias} onChange={(e) => setField('alias', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="alex_dfi" />
        </div>
        <p className="mt-1.5 text-[12px] text-muted-foreground">Visible on your public profile</p>
      </div>

      <div>
        <label className={labelCls}>Occupation</label>
        <input className={INPUT} value={form.occupation} onChange={(e) => setField('occupation', e.target.value)} placeholder="Smart contract developer" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Age group', value: form.ageGroup, field: 'ageGroup', options: AGE_GROUPS },
          { label: 'Gender', value: form.gender, field: 'gender', options: GENDERS },
          { label: 'Education', value: form.education, field: 'education', options: EDUCATION_LEVELS }
        ].map(({ label, value, field, options }) => (
          <div key={field}>
            <label className={labelCls}>{label}</label>
            <select className={INPUT} value={value} onChange={(e) => setField(field as 'ageGroup' | 'gender' | 'education', e.target.value)}>
              <option value="">Select…</option>
              {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div>
        <label className={labelCls}>Bio <span className="ml-1 normal-case opacity-60">(optional)</span></label>
        <textarea className={`${INPUT} resize-none`} rows={4} maxLength={500} value={form.bio} onChange={(e) => setField('bio', e.target.value)} placeholder="Tell the community about yourself…" />
        <p className="mt-1.5 flex justify-end font-mono text-[11px] text-muted-foreground">{form.bio.length}/500</p>
      </div>

      <div className="flex gap-3 border-t border-border pt-4">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
        </button>
        <button type="button" onClick={reset}
          className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:border-muted-foreground hover:bg-muted/50">
          <RotateCcw size={14} />Reset
        </button>
      </div>
    </form>
  );
}
