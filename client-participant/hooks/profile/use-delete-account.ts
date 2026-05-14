'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DELETE_ACCOUNT_REASON_OPTIONS,
  DELETE_ACCOUNT_OTHER_REASON,
  DELETE_CONFIRMATION_WORD,
  type DeleteAccountReason
} from '@/constants/delete-account';

export { DELETE_ACCOUNT_REASON_OPTIONS, DELETE_ACCOUNT_OTHER_REASON, DELETE_CONFIRMATION_WORD };

export function useDeleteAccount() {
  const router = useRouter();
  const [reasonOption, setReasonOption] = useState<DeleteAccountReason | ''>('');
  const [otherReason, setOtherReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);

  const isOther = reasonOption === DELETE_ACCOUNT_OTHER_REASON;
  const isConfirmed = confirmation === DELETE_CONFIRMATION_WORD;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!reasonOption) { setError('Please select a reason.'); return; }
    if (isOther && !otherReason.trim()) { setError('Please describe your reason.'); return; }
    if (!isConfirmed) { setError(`Type "${DELETE_CONFIRMATION_WORD}" to confirm.`); return; }

    setSubmitting(true);
    // TODO: call delete-account API
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitting(false);

    // Mock scheduled deletion 30 days from now
    const date = new Date();
    date.setDate(date.getDate() + 30);
    setScheduledDate(date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
  }

  function cancelDeletion() {
    setScheduledDate(null);
    setReasonOption('');
    setOtherReason('');
    setConfirmation('');
    // TODO: call cancel-deletion API
  }

  return {
    reasonOption, otherReason, confirmation, submitting, error, scheduledDate,
    isOther, isConfirmed,
    setReasonOption, setOtherReason, setConfirmation,
    handleSubmit, cancelDeletion
  };
}
