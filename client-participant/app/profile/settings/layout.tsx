import { SettingsShell } from '@/components/profile/settings-shell';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}
