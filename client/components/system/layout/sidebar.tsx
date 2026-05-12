'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from '@/components/ui/sidebar';
import { dashboardNavGroups, dashboardBottomNavItems } from '@/constants/admin/navigation';
import { usePermissions } from '@/context/permissions-context';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const pathname = usePathname();
  const [volunteerOpen, setVolunteerOpen] = React.useState(() => pathname.startsWith('/volunteers'));
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { can } = usePermissions();

  function isActiveHref(href: string) {
    if (!href.startsWith('/')) return false;
    const normalizedHref = href.split('#')[0];
    if (normalizedHref === '/dashboard') return pathname === '/dashboard';
    return pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`);
  }

  React.useEffect(() => {
    if (isCollapsed) {
      setVolunteerOpen(false);
      return;
    }

    if (pathname.startsWith('/volunteers')) {
      setVolunteerOpen(true);
    }
  }, [isCollapsed, pathname]);

  return (
    <Sidebar collapsible="icon" className="border-0!">
      <SidebarHeader className="h-19.25 justify-center bg-white px-6 group-data-[collapsible=icon]:px-2">
        <span className="text-xl font-bold tracking-tight group-data-[collapsible=icon]:hidden">
          EVENT<span className="text-primary">ARA</span>
        </span>
        <span className="hidden text-center text-xl font-bold tracking-tight group-data-[collapsible=icon]:block">
          A<span className="text-primary">i</span>
        </span>
      </SidebarHeader>

      <SidebarContent className="bg-white px-4 group-data-[collapsible=icon]:px-0">
        {dashboardNavGroups.map((group) => {
          const visibleItems = group.items.filter((item) => !item.permission || can(item.permission.feature, item.permission.action));
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              {group.label && <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{group.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                  {visibleItems.map((item) =>
                    item.children ? (
                      <Collapsible key={item.label} open={volunteerOpen} onOpenChange={setVolunteerOpen} asChild>
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={item.label} isActive={isActiveHref(item.href)} className="h-12 px-4 py-3.5 [&_svg]:size-4.5">
                              <item.icon />
                              <span>{item.label}</span>
                              <ChevronDown
                                className={cn('ml-auto size-4 transition-transform group-data-[collapsible=icon]:hidden', volunteerOpen && 'rotate-180')}
                              />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children.map((child) => (
                                <SidebarMenuSubItem key={child.label}>
                                  <SidebarMenuSubButton asChild isActive={isActiveHref(child.href)} className="h-8 text-sm">
                                    <Link href={child.href} className="flex items-center">
                                      {child.label}
                                      {child.badge ? <Badge className="ml-auto h-4.5 min-w-4.5 px-1 text-[10px]">{child.badge}</Badge> : null}
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    ) : (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton asChild isActive={isActiveHref(item.href)} tooltip={item.label} className="h-12 px-4 py-3.5 [&_svg]:size-4.5">
                          {item.href.startsWith('/') ? (
                            <Link href={item.href}>
                              <item.icon />
                              <span>{item.label}</span>
                            </Link>
                          ) : (
                            <a href={item.href}>
                              <item.icon />
                              <span>{item.label}</span>
                            </a>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="bg-white px-4 group-data-[collapsible=icon]:px-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardBottomNavItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild tooltip={item.label} className="h-12 px-4 py-3.5 [&_svg]:size-4.5">
                    {item.href.startsWith('/') ? (
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    ) : (
                      <a href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </a>
                    )}
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
