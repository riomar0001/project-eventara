'use client';

import { format } from 'date-fns';
import { AlertTriangle, CalendarClock, Loader2, RotateCcw, ShieldAlert, Trash2 } from 'lucide-react';
import { FieldHint } from '@/components/system/forms/field-hint';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useDeleteAccount } from '@/hooks/admin/user-settings/delete-account/use-delete-account';
import { DELETE_ACCOUNT_OTHER_REASON, DELETE_ACCOUNT_REASON_OPTIONS } from '@/constants/admin/user/settings/delete-account';

export default function DeleteAccountPage() {
  const { confirmationValue, errors, form, handleSubmit, isSubmitting, resetForm, scheduledDeletion, setField } = useDeleteAccount();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-700">This will delete your account after 30 days</p>
            <p className="mt-2 text-sm text-red-700/85">
              Your account will be deleted after 30 days. If you log in again within those 30 days, your account will stay active.
            </p>
          </div>
        </div>
      </div>

      {scheduledDeletion ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-amber-700" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-800">Account deletion requested</p>
              <p className="text-sm text-amber-800/90">
                Your account will be deleted on <span className="font-medium">{format(new Date(scheduledDeletion.deletion_scheduled_for), 'PPP p')}</span>.
              </p>
              <p className="text-sm text-amber-800/90">Log in again before then if you want to keep your account active.</p>
            </div>
          </div>
        </div>
      ) : null}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-neutral-700" />
            <div className="text-sm text-neutral-700">
              We require your current password before accepting this request so someone with temporary browser access cannot delete your account without
              re-authenticating.
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="delete-password">
            Current password
          </label>
          <Input
            id="delete-password"
            type="password"
            value={form.currentPassword}
            onChange={(event) => setField('currentPassword', event.target.value)}
            placeholder="Enter your current password"
            autoComplete="current-password"
            disabled={isSubmitting || Boolean(scheduledDeletion)}
          />
          <FieldHint error={errors.currentPassword} hint="Required to authorize the deletion request." />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="delete-reason">
            Reason
          </label>
          <Select value={form.reasonOption} onValueChange={(value) => setField('reasonOption', value)} disabled={isSubmitting || Boolean(scheduledDeletion)}>
            <SelectTrigger className="w-full" id="delete-reason">
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {DELETE_ACCOUNT_REASON_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldHint error={errors.reasonOption} hint="Choose the option that best matches your reason." />
        </div>

        {form.reasonOption === DELETE_ACCOUNT_OTHER_REASON ? (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="delete-other-reason">
              Tell us more
            </label>
            <Textarea
              id="delete-other-reason"
              value={form.otherReason}
              onChange={(event) => setField('otherReason', event.target.value)}
              placeholder="Please specify your reason"
              rows={4}
              disabled={isSubmitting || Boolean(scheduledDeletion)}
            />
            <FieldHint error={errors.otherReason} hint="This will be stored with the deletion request." />
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="delete-confirmation">
            Type <span className="font-semibold">{confirmationValue}</span> to confirm
          </label>
          <Input
            id="delete-confirmation"
            value={form.confirmation}
            onChange={(event) => setField('confirmation', event.target.value)}
            placeholder={`Type ${confirmationValue}`}
            disabled={isSubmitting || Boolean(scheduledDeletion)}
          />
          <FieldHint error={errors.confirmation} hint="This extra confirmation helps prevent accidental requests." />
        </div>

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row">
          <Button type="submit" variant="destructive" disabled={isSubmitting || Boolean(scheduledDeletion)}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {isSubmitting ? 'Deleting account...' : 'Delete account'}
          </Button>
          <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting || Boolean(scheduledDeletion)}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
}

