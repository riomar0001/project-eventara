'use client';

import * as React from 'react';
import { LayoutDashboard, User, ArrowLeftRight, Waves, Wallet, TrendingUp, BookOpen, Headphones, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '#', active: true },
  { label: 'Accounts', icon: User, href: '#' },
  {
    label: 'Transactions',
    icon: ArrowLeftRight,
    href: '#',
    children: [
      { label: 'History', href: '#', badge: 19 },
      { label: 'Integration', href: '#' },
      { label: 'Reports', href: '#' }
    ]
  },
  { label: 'Cash flow', icon: Waves, href: '#' },
  { label: 'Budget', icon: Wallet, href: '#' },
  { label: 'Investments', icon: TrendingUp, href: '#' }
];

const bottomItems = [
  { label: 'Learning center', icon: BookOpen, href: '#' },
  { label: 'Support', icon: Headphones, href: '#' }
];

export function AppSidebar() {
  const [transactionsOpen, setTransactionsOpen] = React.useState(true);

  return (
    <Sidebar>
      {/* Logo */}
      <SidebarHeader className="h-19.25 justify-center bg-white px-6">
        <span className="text-xl font-bold tracking-tight">
          ACRU<span className="text-primary">i</span>
        </span>
      </SidebarHeader>

      <SidebarContent className="bg-white px-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className='gap-2'>
              {navItems.map((item) =>
                item.children ? (
                  <Collapsible key={item.label} open={transactionsOpen} onOpenChange={setTransactionsOpen} asChild>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className={cn('h-10 [&_svg]:size-4.5', transactionsOpen && 'text-foreground')}>
                          <item.icon />
                          <span>{item.label}</span>
                          <ChevronDown className={cn('ml-auto size-4 transition-transform', transactionsOpen && 'rotate-180')} />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.label}>
                              <SidebarMenuSubButton asChild className="h-8 text-sm">
                                <a href={child.href} className="flex items-center">
                                  {child.label}
                                  {child.badge ? <Badge className="ml-auto h-4.5 min-w-4.5 px-1 text-[10px]">{child.badge}</Badge> : null}
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={item.active} className="h-12 px-4 py-3.5 [&_svg]:size-4.5">
                      <a href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-white">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild className="h-12 px-4 py-3.5 [&_svg]:size-4.5">
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Upgrade card */}
        <div className="bg-foreground text-background mx-2 mb-2 rounded-xl p-5">
          <p className="mb-1 text-sm font-semibold">Upgrade to Pro!</p>
          <p className="text-background/70 mb-3 text-xs">Full financial insights with analytics and graphs.</p>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
            Upgrade now
          </Button>
        </div>

        <div className="flex items-center justify-between px-2 pb-2">
          <SidebarTrigger />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
