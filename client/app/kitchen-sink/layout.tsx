import { AppShell } from '@/components/system/layout/app-shell';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
