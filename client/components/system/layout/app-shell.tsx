import { Header } from '@/components/system/layout/header';
import { AppSidebar } from '@/components/system/layout/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex max-h-screen flex-col overflow-hidden rounded-3xl bg-neutral-100 pb-5">
        <Header />
        <main className="overflow-y-auto rounded-3xl px-5">
          <div className="mb-5">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

