'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SettingsShell } from '@/components/settings/settings-shell';
import { toast } from 'sonner';

export default function DeleteAccountPage() {
  const [confirmation, setConfirmation] = useState('');

  function handleDelete() {
    toast.info('Delete account will be available soon.');
  }

  return (
    <SettingsShell title="Delete Account" description="This area is for permanently removing your account.">
      <div className="space-y-5">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-700">This action is permanent</p>
              <p className="mt-2 text-sm text-red-700/85">If you delete your account, you may lose access to your profile and saved activity.</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="delete-confirmation">
            Type <span className="font-semibold">DELETE</span> to confirm
          </label>
          <Input
            id="delete-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="Type DELETE"
          />
        </div>

        <Button variant="destructive" disabled={confirmation !== 'DELETE'} onClick={handleDelete}>
          Delete account
        </Button>
      </div>
    </SettingsShell>
  );
}
