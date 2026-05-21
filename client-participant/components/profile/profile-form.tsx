'use client';

import { Loader2, RotateCcw, Save } from 'lucide-react';
import { useProfileForm } from '@/hooks/profile/use-profile-form';
import { useAvatarUpload } from '@/hooks/profile/use-avatar-upload';
import { useAuthStore } from '@/store/auth-store';
import { AGE_GROUP_OPTIONS, GENDER_OPTIONS, EDUCATION_LEVEL_OPTIONS } from '@/constants/profile';

const INPUT =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none';

const labelCls = 'mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground';

export function ProfileForm() {
  const { form, saving, saved, error, setField, reset, handleSubmit } = useProfileForm();
  const { inputRef, uploading, error: uploadError, openPicker, handleFileChange } = useAvatarUpload();
  const user = useAuthStore((s) => s.user);

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <p className="text-muted-foreground mb-3 font-mono text-[11px] tracking-[0.14em] uppercase">Profile picture</p>
        <div className="flex items-center gap-4">
          {user?.image ? (
            <img src={user.image} alt="Profile" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
          ) : (
            <div className="bg-primary/10 text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold">
              {(form.firstName[0] ?? 'U').toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <p className="text-foreground text-sm font-medium">Upload a photo</p>
            <p className="text-muted-foreground mt-0.5 text-xs">JPG, PNG, WebP, or GIF · max 2 MB</p>
            {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={openPicker}
            className="border-border text-muted-foreground hover:border-muted-foreground shrink-0 rounded-xl border px-3 py-2 text-xs font-medium transition-all disabled:opacity-60"
          >
            {uploading ? 'Uploading…' : 'Choose file'}
          </button>
        </div>
      </div>

      <div className="bg-border h-px" />

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
          <span className="text-muted-foreground absolute top-1/2 left-4 -translate-y-1/2 text-sm font-medium">@</span>
          <input
            className={`${INPUT} pl-8`}
            value={form.alias}
            onChange={(e) => setField('alias', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="alex_dfi"
          />
        </div>
        <p className="text-muted-foreground mt-1.5 text-[12px]">Visible on your public profile</p>
      </div>

      <div>
        <label className={labelCls}>Occupation</label>
        <input className={INPUT} value={form.occupation} onChange={(e) => setField('occupation', e.target.value)} placeholder="Smart contract developer" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
        <div>
          <label className={labelCls}>Education</label>
          <select className={INPUT} value={form.education} onChange={(e) => setField('education', e.target.value)}>
            <option value="">Select…</option>
            {EDUCATION_LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>
          Bio <span className="ml-1 normal-case opacity-60">(optional)</span>
        </label>
        <textarea
          className={`${INPUT} resize-none`}
          rows={4}
          maxLength={500}
          value={form.bio}
          onChange={(e) => setField('bio', e.target.value)}
          placeholder="Tell the community about yourself…"
        />
        <p className="text-muted-foreground mt-1.5 flex justify-end font-mono text-[11px]">{form.bio.length}/500</p>
      </div>

      {error && <p className="text-destructive text-[13px] font-medium">{error}</p>}

      <div className="border-border flex gap-3 border-t pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-primary-foreground flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="border-border text-muted-foreground hover:border-muted-foreground hover:bg-muted/50 flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </form>
  );
}
