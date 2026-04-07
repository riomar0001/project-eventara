'use client';

import { Search, Bell, Settings, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Header() {
  return (
    <header className="flex h-17.5 shrink-0 items-center gap-4 bg-neutral-100 px-6">
      {/* Search */}
      <div className="relative flex max-h-11 w-1/4 flex-row items-center">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input className="h-11 max-w-full bg-white pl-9 text-sm" placeholder="Quick search" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button size="icon-sm" className="size-11 rounded-xl bg-white hover:bg-white/90">
          <Bell className="size-4" />
        </Button>
        <Button size="icon-sm" className="size-11 rounded-xl bg-white hover:bg-white/90">
          <Settings className="size-4" />
        </Button>

        {/* User */}
        <div className="flex h-11 items-center gap-2.5 rounded-xl bg-white p-1 px-2.5 pr-10">
          <Avatar className="size-8">
            <AvatarImage src="" alt="Michael Johnson" />
            <AvatarFallback className="text-xs">MJ</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs leading-tight font-semibold">Michael Johnson</span>
            <span className="text-muted-foreground text-[10px] leading-tight">m.johnson@finex.com</span>
          </div>
        </div>
      </div>
    </header>
  );
}
