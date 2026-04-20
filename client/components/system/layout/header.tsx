'use client';

import { useState } from 'react';
import { Search, Bell, Settings, User, LogOut, Shield, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Authentication } from '@/api/sdk.gen';
import { notifications } from '@/constants/system/notifications';
import { getDisplayName, getInitials } from '@/lib/user/profile';
import { useAuthStore } from '@/store/auth-store';

export function Header() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const displayName = getDisplayName(user);
  const email = user?.email ?? 'Signed in';
  const initials = getInitials(user);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    let revokeFailed = false;

    try {
      if (refreshToken) {
        const result = await Authentication.logoutAuthLogoutPost({
          body: { refresh_token: refreshToken },
          throwOnError: false
        });

        const status = (result as { response?: { status?: number } }).response?.status;
        if (!result.data && status && status !== 400) {
          revokeFailed = true;
        }
      }
    } catch {
      revokeFailed = true;
    } finally {
      clearAuth();

      if (revokeFailed) {
        toast.warning('Logged out locally, but the server session could not be revoked.');
      } else {
        toast.success('Logged out successfully.');
      }

      router.replace('/login');
      router.refresh();
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="my-5 flex shrink-0 items-center gap-4 bg-neutral-100 px-5">
      <SidebarTrigger className="hover:bg-primary/30 size-11 rounded-xl bg-white" />
      {/* Search */}
      <div className="relative hidden max-h-11 w-1/3 flex-row items-center md:flex lg:w-1/4">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input className="h-11 max-w-full bg-white pl-9 text-sm" placeholder="Quick search" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" className="hover:bg-primary/30 relative size-11 rounded-xl bg-white">
              <Bell className="size-4" />
              {notifications.some((n) => n.unread) && <span className="absolute top-2 right-2 size-2 rounded-full" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" collisionPadding={20} className="w-80 max-w-[calc(100vw-40px)] rounded-xl p-2">
            <div className="flex items-center justify-between px-2 py-2">
              <span className="text-sm font-semibold">Notifications</span>
              <Button variant="ghost" size="xs" className="text-muted-foreground hover:text-foreground h-auto p-0 text-xs">
                Mark all read
              </Button>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="mt-1 flex flex-col gap-0.5">
              {notifications.map((n) => (
                <DropdownMenuItem key={n.id} className="group cursor-pointer items-start gap-3 rounded-lg px-2 py-3">
                  <div className="bg-muted mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <n.icon className="text-muted-foreground size-4" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">{n.title}</span>
                      <span className="text-muted-foreground shrink-0 text-[10px]">{n.time}</span>
                    </div>
                    <p className="text-muted-foreground text-xs leading-snug">{n.description}</p>
                  </div>
                  {n.unread && <span className="bg-primary mt-1.5 size-1.5 shrink-0 self-start rounded-full" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="mt-1" />
            <DropdownMenuItem className="mt-1 cursor-pointer justify-center rounded-lg py-2.5 text-xs font-medium">View all notifications</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="icon-sm" className="hover:bg-primary/30 size-11 rounded-xl bg-white">
          <Settings className="size-4" />
        </Button>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="hover:bg-primary/30 flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1 transition-colors outline-none sm:w-60 sm:justify-between sm:px-2.5 sm:pr-5">
              <div className="flex items-center gap-2.5">
                <Avatar className="size-8 shrink-0">
                  <AvatarImage alt={displayName} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden flex-col text-left sm:flex">
                  <span className="text-xs leading-tight font-semibold">{displayName}</span>
                  <span className="text-muted-foreground text-[10px] leading-tight">{email}</span>
                </div>
              </div>
              <ChevronDown className="text-muted-foreground hidden size-3.5 sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl p-2">
            <DropdownMenuLabel className="py-3 font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{displayName}</span>
                <span className="text-muted-foreground text-xs">{email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer py-3" onClick={() => router.push('/admin/user/profile')}>
                <User className="size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-3" onClick={() => router.push('/admin/user/settings/password')}>
                <Shield className="size-4" />
                Security
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-3" onClick={() => router.push('/admin/user/settings/profile')}>
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="cursor-pointer py-3" onClick={handleLogout} disabled={isLoggingOut}>
              <LogOut className="size-4" />
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
