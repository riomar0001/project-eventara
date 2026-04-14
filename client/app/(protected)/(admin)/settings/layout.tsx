'use client';

import { SettingsShell } from '@/components/settings/settings-shell';

export default function AccountSettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}
