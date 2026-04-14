'use client';

import { Clock3 } from 'lucide-react';
import { SettingsShell } from '@/components/settings/settings-shell';

export default function LoginHistoryPage() {
  return (
    <SettingsShell title="Login History" description="Check recent sign-ins to your account.">
      <div className="rounded-2xl border border-dashed border-border p-5">
        <div className="flex items-start gap-3">
          <Clock3 className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-sm font-medium">Nothing to show yet</p>
            <p className="text-muted-foreground mt-2 text-sm">When this is ready, you&apos;ll be able to review your recent account activity here.</p>
          </div>
        </div>
      </div>
    </SettingsShell>
  );
}
