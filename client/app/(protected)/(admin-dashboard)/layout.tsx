import { AppShell } from '@/components/system/layout/app-shell';
import { PermissionsProvider } from '@/context/permissions-context';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionsProvider>
      <AppShell>{children}</AppShell>
    </PermissionsProvider>
  );
}
