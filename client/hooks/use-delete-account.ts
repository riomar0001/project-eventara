import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { DELETE_ACCOUNT_OTHER_REASON } from '@/constants/delete-account';
import { getAccessToken } from '@/store/auth-store';

const deleteAccountResponseSchema = z.object({
  success: z.boolean(),
  user_id: z.uuid(),
  deletion_requested_at: z.string(),
  deletion_scheduled_for: z.string(),
  requested_by: z.uuid(),
  grace_period_days: z.number(),
  message: z.string()
});

export type DeleteAccountResponse = z.infer<typeof deleteAccountResponseSchema>;

export interface DeleteAccountFormState {
  currentPassword: string;
  reasonOption: string;
  otherReason: string;
  confirmation: string;
}

export type DeleteAccountFormErrors = Partial<Record<keyof DeleteAccountFormState, string>>;

const DELETE_CONFIRMATION_VALUE = 'DELETE';

function getInitialState(): DeleteAccountFormState {
  return {
    currentPassword: '',
    reasonOption: '',
    otherReason: '',
    confirmation: ''
  };
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const maybeError = error as { detail?: unknown; message?: unknown };

    if (typeof maybeError.detail === 'string') {
      return maybeError.detail;
    }

    if (Array.isArray(maybeError.detail) && maybeError.detail.length > 0) {
      const firstError = maybeError.detail[0] as { msg?: unknown } | undefined;
      if (typeof firstError?.msg === 'string') {
        return firstError.msg;
      }
    }

    if (typeof maybeError.message === 'string') {
      return maybeError.message;
    }
  }

  return 'Unable to schedule account deletion right now.';
}

function validateForm(form: DeleteAccountFormState) {
  const errors: DeleteAccountFormErrors = {};

  if (!form.currentPassword.trim()) {
    errors.currentPassword = 'Current password is required.';
  }

  if (!form.reasonOption) {
    errors.reasonOption = 'Please select a reason.';
  }

  if (form.reasonOption === DELETE_ACCOUNT_OTHER_REASON && !form.otherReason.trim()) {
    errors.otherReason = 'Please specify your reason.';
  }

  if (form.confirmation.trim() !== DELETE_CONFIRMATION_VALUE) {
    errors.confirmation = 'Type DELETE exactly to confirm.';
  }

  return errors;
}

export function useDeleteAccount() {
  const [form, setForm] = useState<DeleteAccountFormState>(() => getInitialState());
  const [errors, setErrors] = useState<DeleteAccountFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduledDeletion, setScheduledDeletion] = useState<DeleteAccountResponse | null>(null);

  function setField<K extends keyof DeleteAccountFormState>(field: K, value: DeleteAccountFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function resetForm() {
    setForm(getInitialState());
    setErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || scheduledDeletion) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
      toast.error('You need to be signed in to manage account deletion.');
      return;
    }

    const nextErrors = validateForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/user/account-deletion', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: form.currentPassword,
          reason: (form.reasonOption === DELETE_ACCOUNT_OTHER_REASON ? form.otherReason : form.reasonOption).trim()
        })
      });

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        throw payload ?? new Error('Unable to schedule account deletion right now.');
      }

      const parsed = deleteAccountResponseSchema.parse(payload);
      setScheduledDeletion(parsed);
      setForm((current) => ({
        ...current,
        currentPassword: '',
        otherReason: '',
        confirmation: ''
      }));
      setErrors({});
      toast.success('Your account will be deleted after 30 days unless you log in again before then.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    confirmationValue: DELETE_CONFIRMATION_VALUE,
    errors,
    form,
    handleSubmit,
    isSubmitting,
    resetForm,
    scheduledDeletion,
    setField
  };
}
