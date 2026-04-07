"use client"

import { Search, Bell, Settings, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
  return (
    <header className="flex h-[70px] shrink-0 items-center gap-4 border-b bg-background px-6">
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9 text-sm placeholder:text-muted-foreground" placeholder="Quick search" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon-sm">
          <Bell className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm">
          <Settings className="size-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <Avatar className="size-10">
            <AvatarImage src="" alt="Michael Johnson" />
            <AvatarFallback className="text-xs">MJ</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs font-semibold leading-tight">Michael Johnson</span>
            <span className="text-[10px] text-muted-foreground leading-tight">m.johnson@finex.com</span>
          </div>
        </div>

        <Button variant="outline" size="sm" className="ml-2 gap-1.5">
          <Plus className="size-4" />
          Add widget
        </Button>
      </div>
    </header>
  )
}
