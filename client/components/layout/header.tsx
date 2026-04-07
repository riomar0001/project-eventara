'use client';

import { Search, Bell, Settings, User, LogOut, CreditCard, ChevronDown } from 'lucide-react';
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

export function Header() {
  return (
    <header className="flex  shrink-0 items-center gap-4 bg-neutral-100">
      <SidebarTrigger className="hover:bg-primary/30 size-11 rounded-xl bg-white" />
      {/* Search */}
      <div className="relative flex max-h-11 w-1/4 flex-row items-center">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input className="h-11 max-w-full bg-white pl-9 text-sm" placeholder="Quick search" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button size="icon-sm" className="hover:bg-primary/30 size-11 rounded-xl bg-white">
          <Bell className="size-4" />
        </Button>
        <Button size="icon-sm" className="hover:bg-primary/30 size-11 rounded-xl bg-white">
          <Settings className="size-4" />
        </Button>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="hover:bg-primary/30 flex h-11 w-60 items-center rounded-xl bg-white p-1 px-2.5 pr-5 transition-colors outline-none">
              <div className="flex w-full items-center justify-between">
                <div className="items-cente flex w-full flex-row gap-2.5">
                  <Avatar className="size-8">
                    <AvatarImage src="" alt="Michael Johnson" />
                    <AvatarFallback className="text-xs">MJ</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="text-xs leading-tight font-semibold">Michael Johnson</span>
                    <span className="text-muted-foreground text-[10px] leading-tight">m.johnson@finex.com</span>
                  </div>
                </div>
                <ChevronDown className="text-muted-foreground ml-1 size-3.5" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="p-2rounded-xl">
            <DropdownMenuLabel className="py-3 font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">Michael Johnson</span>
                <span className="text-muted-foreground text-xs">m.johnson@finex.com</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="py-3">
                <User className="size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="py-3">
                <CreditCard className="size-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem className="py-3">
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="py-3">
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
