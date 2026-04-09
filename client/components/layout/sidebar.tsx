'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  useSidebar
} from '@/components/ui/sidebar';
import { navItems, bottomNavItems as bottomItems } from '@/constants/navigation';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const [transactionsOpen, setTransactionsOpen] = React.useState(true);
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // Close sub-menu when sidebar collapses to icon mode
  React.useEffect(() => {
    if (isCollapsed) setTransactionsOpen(false);
  }, [isCollapsed]);

  return (
    <Sidebar collapsible="icon" className="border-0!">
      {/* Logo */}
      <SidebarHeader className="h-19.25 justify-center bg-white px-6 group-data-[collapsible=icon]:px-2">
        <span className="text-xl font-bold tracking-tight group-data-[collapsible=icon]:hidden">
          EVENT<span className="text-primary">ARA</span>
        </span>
        <span className="hidden text-center text-xl font-bold tracking-tight group-data-[collapsible=icon]:block">
          A<span className="text-primary">i</span>
        </span>
      </SidebarHeader>

      <SidebarContent className="bg-white px-4 group-data-[collapsible=icon]:px-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navItems.map((item) =>
                item.children ? (
                  <Collapsible key={item.label} open={transactionsOpen} onOpenChange={setTransactionsOpen} asChild>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.label} className={cn('h-10 [&_svg]:size-4.5', transactionsOpen && 'text-foreground')}>
                          <item.icon />
                          <span>{item.label}</span>
                          <ChevronDown
                            className={cn('ml-auto size-4 transition-transform group-data-[collapsible=icon]:hidden', transactionsOpen && 'rotate-180')}
                          />
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
                    <SidebarMenuButton asChild isActive={item.active} tooltip={item.label} className="h-12 px-4 py-3.5 [&_svg]:size-4.5">
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

      <SidebarFooter className="bg-white px-4 group-data-[collapsible=icon]:px-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild tooltip={item.label} className="h-12 px-4 py-3.5 [&_svg]:size-4.5">
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
      </SidebarFooter>
    </Sidebar>
  );
}
