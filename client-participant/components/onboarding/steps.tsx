import { CheckCircle2 } from 'lucide-react';
import type { OnboardingForm } from '@/hooks/onboarding/use-onboarding';
import { AGE_GROUP_OPTIONS, GENDER_OPTIONS, EDUCATION_LEVEL_OPTIONS } from '@/constants/profile';

const INPUT =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none';

const labelCls = 'mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground';

type StepProps = { form: OnboardingForm; setField: (key: keyof OnboardingForm, value: string) => void };

export function StepBasicInfo({ form, setField }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-foreground text-[22px] font-bold tracking-[-0.025em]">Welcome to Eventara</h2>
        <p className="text-muted-foreground mt-1 text-[13.5px]">Let&apos;s get your profile set up. This takes under a minute.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
        <label className={labelCls}>Username / alias</label>
        <div className="relative">
          <span className="text-muted-foreground absolute top-1/2 left-4 -translate-y-1/2 text-sm font-medium">@</span>
          <input
            className={`${INPUT} pl-8`}
            value={form.alias}
            onChange={(e) => setField('alias', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="alex_dfi"
          />
        </div>
        <p className="text-muted-foreground mt-1.5 text-[12px]">Lowercase letters, numbers, and underscores only.</p>
      </div>
    </div>
  );
}

export function StepAboutYou({ form, setField }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-foreground text-[22px] font-bold tracking-[-0.025em]">About you</h2>
        <p className="text-muted-foreground mt-1 text-[13.5px]">Help others in the community know who you are.</p>
      </div>
      <div>
        <label className={labelCls}>Occupation</label>
        <input className={INPUT} value={form.occupation} onChange={(e) => setField('occupation', e.target.value)} placeholder="e.g. Smart contract developer" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Age group</label>
          <select className={INPUT} value={form.ageGroup} onChange={(e) => setField('ageGroup', e.target.value)}>
            <option value="">Select…</option>
            {AGE_GROUP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Gender</label>
          <select className={INPUT} value={form.gender} onChange={(e) => setField('gender', e.target.value)}>
            <option value="">Select…</option>
            {GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Education level</label>
        <select className={INPUT} value={form.educationLevel} onChange={(e) => setField('educationLevel', e.target.value)}>
          <option value="">Select…</option>
          {EDUCATION_LEVEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>
          Bio <span className="ml-1 normal-case opacity-60">(optional)</span>
        </label>
        <textarea
          className={`${INPUT} resize-none`}
          rows={3}
          value={form.bio}
          onChange={(e) => setField('bio', e.target.value)}
          placeholder="Tell the community about yourself…"
        />
      </div>
    </div>
  );
}

type ReviewProps = { form: OnboardingForm; goToStep: (n: number) => void };

export function StepReview({ form, goToStep }: ReviewProps) {
  const displayName = [form.firstName, form.lastName].filter(Boolean).join(' ') || 'No name set';
  const initials = ((form.firstName[0] ?? '') + (form.lastName[0] ?? '')).toUpperCase() || '?';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-foreground text-[22px] font-bold tracking-[-0.025em]">Review your profile</h2>
        <p className="text-muted-foreground mt-1 text-[13.5px]">Everything look right? You can still edit before submitting.</p>
      </div>

      <div className="border-border bg-background rounded-2xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">Identity</p>
          <button
            type="button"
            onClick={() => goToStep(0)}
            className="text-primary hover:bg-primary/10 rounded-lg px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.08em] transition-all"
          >
            Edit
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold">{initials}</div>
          <div>
            <p className="text-foreground font-semibold">{displayName}</p>
            {form.alias && <p className="text-muted-foreground font-mono text-[12px]">@{form.alias}</p>}
          </div>
        </div>
      </div>

      <div className="border-border bg-background rounded-2xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">About you</p>
          <button
            type="button"
            onClick={() => goToStep(1)}
            className="text-primary hover:bg-primary/10 rounded-lg px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.08em] transition-all"
          >
            Edit
          </button>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Occupation', value: form.occupation },
            { label: 'Age group', value: form.ageGroup },
            { label: 'Gender', value: form.gender },
            { label: 'Education', value: form.educationLevel }
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2 text-[13px]">
              <span className="text-muted-foreground w-24 shrink-0">{label}</span>
              <span className={value ? 'text-foreground capitalize' : 'text-muted-foreground'}>{value ? value.replace(/_/g, ' ') : <em className="not-italic opacity-50">Not set</em>}</span>
            </div>
          ))}
          {form.bio && (
            <div className="border-border text-muted-foreground mt-3 rounded-xl border px-3 py-2.5 text-[13px] leading-relaxed italic">
              &ldquo;{form.bio}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function StepComplete({ alias }: { alias: string }) {
  return (
    <div className="py-6 text-center">
      <div className="bg-primary/10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
        <CheckCircle2 size={32} className="text-primary" />
      </div>
      <h2 className="text-foreground text-[22px] font-bold tracking-[-0.025em]">You&apos;re all set!</h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-[32ch] text-[13.5px]">
        Your profile is ready. Start exploring events in the Davao DeFi community.
      </p>
      <div className="bg-primary/10 text-primary mx-auto mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-mono text-[12px]">
        <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
        {alias ? `@${alias}` : '@participant'} · Participant
      </div>
    </div>
  );
}
