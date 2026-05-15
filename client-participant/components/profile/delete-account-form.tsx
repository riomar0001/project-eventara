'use client';

import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { useDeleteAccount, DELETE_ACCOUNT_REASON_OPTIONS, DELETE_CONFIRMATION_WORD } from '@/hooks/profile/use-delete-account';

const INPUT =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-destructive focus:ring-2 focus:ring-destructive/10 focus:outline-none';

const labelCls = 'mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground';

export function DeleteAccountForm() {
  const {
    reasonOption,
    otherReason,
    confirmation,
    submitting,
    error,
    scheduledDate,
    isOther,
    isConfirmed,
    setReasonOption,
    setOtherReason,
    setConfirmation,
    handleSubmit,
    cancelDeletion
  } = useDeleteAccount();

  if (scheduledDate) {
    return (
      <div className="space-y-6">
        <div className="border-destructive/30 bg-destructive/5 flex items-start gap-4 rounded-2xl border p-5">
          <ShieldAlert size={20} className="text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-destructive font-semibold">Deletion scheduled</p>
            <p className="text-muted-foreground mt-1 text-[13.5px]">
              Your account is scheduled for permanent deletion on <strong>{scheduledDate}</strong>. You can cancel at any time before that date.
            </p>
          </div>
        </div>
        <button
          onClick={cancelDeletion}
          className="border-border text-muted-foreground hover:border-muted-foreground rounded-full border px-5 py-2.5 text-sm font-semibold transition-all"
        >
          Cancel deletion
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div className="border-destructive/25 bg-destructive/5 flex items-start gap-3 rounded-2xl border p-4">
        <AlertTriangle size={16} className="text-destructive mt-0.5 shrink-0" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          Deleting your account is permanent. All your data, event history, and preferences will be removed after a 30-day grace period.
        </p>
      </div>

      <div>
        <label className={labelCls}>Why are you leaving?</label>
        <select className={INPUT} value={reasonOption} onChange={(e) => setReasonOption(e.target.value as typeof reasonOption)}>
          <option value="">Select a reason…</option>
          {DELETE_ACCOUNT_REASON_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {isOther && (
        <div>
          <label className={labelCls}>Tell us more</label>
          <textarea
            className={`${INPUT} resize-none`}
            rows={3}
            placeholder="Describe your reason…"
            value={otherReason}
            onChange={(e) => setOtherReason(e.target.value)}
          />
        </div>
      )}

      <div>
        <label className={labelCls}>
          Type <span className="text-foreground font-bold">{DELETE_CONFIRMATION_WORD}</span> to confirm
        </label>
        <input
          className={INPUT}
          placeholder={DELETE_CONFIRMATION_WORD}
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoComplete="off"
        />
      </div>

      {error && <p className="text-destructive text-[13px] font-medium">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !isConfirmed}
        className="bg-destructive flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_28px_-10px_oklch(0.7_0.2_25_/_0.5)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
      >
        {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
        {submitting ? 'Scheduling deletion…' : 'Delete my account'}
      </button>
    </form>
  );
}
