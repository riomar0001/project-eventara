'use client';

import { useState } from 'react';
import { AccountSettings } from '@/api/sdk.gen';
import { humanizeApiError } from '@/lib/api-error';
import { DELETE_ACCOUNT_REASON_OPTIONS, DELETE_ACCOUNT_OTHER_REASON, DELETE_CONFIRMATION_WORD, type DeleteAccountReason } from '@/constants/delete-account';

export { DELETE_ACCOUNT_REASON_OPTIONS, DELETE_ACCOUNT_OTHER_REASON, DELETE_CONFIRMATION_WORD };

export function useDeleteAccount() {
  const [reasonOption, setReasonOption] = useState<DeleteAccountReason | ''>('');
  const [otherReason, setOtherReason] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);

  const isOther = reasonOption === DELETE_ACCOUNT_OTHER_REASON;
  const isConfirmed = confirmation === DELETE_CONFIRMATION_WORD;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!reasonOption) {
      setError('Please choose a reason for deleting your account.');
      return;
    }
    if (isOther && !otherReason.trim()) {
      setError("Please tell us a bit more about why you're leaving.");
      return;
    }
    if (!currentPassword) {
      setError('Please enter your current password to confirm this action.');
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
