import { AuthGuard } from '@/components/authentication/auth-guard';
import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex max-h-screen flex-col overflow-hidden rounded-3xl bg-neutral-100 pb-5">
          <Header />
          <main className="overflow-y-auto rounded-3xl px-5">
            <div className="mb-5">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
