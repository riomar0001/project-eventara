'use client';

import { useState } from 'react';
import { AccountSettings } from '@/api/sdk.gen';
import { humanizeApiError } from '@/lib/api-error';
import { DELETE_ACCOUNT_REASON_OPTIONS, DELETE_ACCOUNT_OTHER_REASON, DELETE_CONFIRMATION_WORD, type DeleteAccountReason } from '@/constants/delete-account';

export { DELETE_ACCOUNT_REASON_OPTIONS, DELETE_ACCOUNT_OTHER_REASON, DELETE_CONFIRMATION_WORD };

type FieldErrors = { reason: string; otherReason: string; password: string };

export function useDeleteAccount() {
  const [reasonOption, setReasonOptionRaw] = useState<DeleteAccountReason | ''>('');
  const [otherReason, setOtherReasonRaw] = useState('');
  const [currentPassword, setCurrentPasswordRaw] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({ reason: '', otherReason: '', password: '' });
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);

  const isOther = reasonOption === DELETE_ACCOUNT_OTHER_REASON;
  const isConfirmed = confirmation === DELETE_CONFIRMATION_WORD;

  function setReasonOption(v: DeleteAccountReason | '') {
    setReasonOptionRaw(v);
    if (errors.reason) setErrors((e) => ({ ...e, reason: '' }));
  }

  function setOtherReason(v: string) {
    setOtherReasonRaw(v);
    if (errors.otherReason) setErrors((e) => ({ ...e, otherReason: '' }));
  }

  function setCurrentPassword(v: string) {
    setCurrentPasswordRaw(v);
    if (errors.password) setErrors((e) => ({ ...e, password: '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const nextErrors: FieldErrors = { reason: '', otherReason: '', password: '' };
    if (!reasonOption) nextErrors.reason = 'Please choose a reason for deleting your account.';
    if (isOther && !otherReason.trim()) nextErrors.otherReason = "Please tell us a bit more about why you're leaving.";
    if (!currentPassword) nextErrors.password = 'Please enter your current password to confirm this action.';
    if (nextErrors.reason || nextErrors.otherReason || nextErrors.password) {
      setErrors(nextErrors);
      return;
    }
    if (!isConfirmed) {
      setError(`Type "${DELETE_CONFIRMATION_WORD}" to confirm.`);
      return;
    }

    setSubmitting(true);

    const reason = isOther ? otherReason.trim() : (reasonOption as string);

    const { data, error: apiError } = await AccountSettings.scheduleOwnAccountDeletionUserAccountDeletionPost({
      body: { current_password: currentPassword, reason },
    });

    setSubmitting(false);

    if (apiError || !data) {
      setError(humanizeApiError((apiError as { message?: string } | null)?.message, "Couldn't schedule your account deletion. Please check your password and try again."));
      return;
    }

    const scheduledFor = new Date(data.deletion_scheduled_for);
    setScheduledDate(scheduledFor.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
  }

  function cancelDeletion() {
    setScheduledDate(null);
    setReasonOption('');
    setOtherReason('');
    setCurrentPassword('');
    setConfirmation('');
  }

  return {
    reasonOption,
    otherReason,
    currentPassword,
    confirmation,
    submitting,
    error,
    errors,
    scheduledDate,
    isOther,
    isConfirmed,
    setReasonOption,
    setOtherReason,
    setCurrentPassword,
    setConfirmation,
    handleSubmit,
    cancelDeletion
  };
}
