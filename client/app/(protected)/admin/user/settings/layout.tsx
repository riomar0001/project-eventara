'use client';

import { SettingsShell } from '@/components/admin/user-settings/settings-shell';

export default function AccountSettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}
