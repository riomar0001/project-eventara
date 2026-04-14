'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { User as UserApi } from '@/api/sdk.gen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SettingsShell } from '@/components/settings/settings-shell';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

function getErrorMessage(error: unknown) {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const maybeDetail = (error as { detail?: unknown }).detail;
    if (typeof maybeDetail === 'string') return maybeDetail;
  }
  return 'Something went wrong. Please try again.';
}

export default function SecurityPage() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await UserApi.changePasswordUserChangePasswordPost({
        body: {
          current_password: currentPassword,
          new_password: newPassword
        },
        throwOnError: false
      });

      if (result.error || !result.data) {
        toast.error(getErrorMessage(result.error));
        return;
      }

      toast.success('Password changed successfully. Please sign in again.');
      clearAuth();
      router.replace('/login');
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SettingsShell title="Security" description="Change your password.">
      <form className="max-w-2xl space-y-4" onSubmit={handleChangePassword}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="current-password">
            Current password
          </label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Enter your current password"
            autoComplete="current-password"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="new-password">
            New password
          </label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="confirm-password">
            Confirm new password
          </label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div className="rounded-xl border border-border bg-neutral-50 p-4 text-sm text-neutral-700">
          Choose a strong new password. After you change it, you&apos;ll sign in again with the new one.
        </div>

        <Button type="submit" disabled={isSubmitting}>
          <KeyRound className="size-4" />
          {isSubmitting ? 'Updating password...' : 'Change password'}
        </Button>
      </form>
    </SettingsShell>
  );
}
