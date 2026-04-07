"use client"

import * as React from "react"
import {
  LayoutDashboard,
  User,
  ArrowLeftRight,
  Waves,
  Wallet,
  TrendingUp,
  BookOpen,
  Headphones,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
  SidebarTrigger,
} from "@/components/ui/sidebar"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "#", active: true },
  { label: "Accounts", icon: User, href: "#" },
  {
    label: "Transactions",
    icon: ArrowLeftRight,
    href: "#",
    children: [
      { label: "History", href: "#", badge: 19 },
      { label: "Integration", href: "#" },
      { label: "Reports", href: "#" },
    ],
  },
  { label: "Cash flow", icon: Waves, href: "#" },
  { label: "Budget", icon: Wallet, href: "#" },
  { label: "Investments", icon: TrendingUp, href: "#" },
]

const bottomItems = [
  { label: "Learning center", icon: BookOpen, href: "#" },
  { label: "Support", icon: Headphones, href: "#" },
]

export function AppSidebar() {
  const [transactionsOpen, setTransactionsOpen] = React.useState(true)

  return (
    <Sidebar>
      {/* Logo */}
      <SidebarHeader className="h-[77px] justify-center px-5">
        <span className="text-xl font-bold tracking-tight">
          ACRU<span className="text-primary">i</span>
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) =>
                item.children ? (
                  <Collapsible
                    key={item.label}
                    open={transactionsOpen}
                    onOpenChange={setTransactionsOpen}
                    asChild
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className={cn(
                            "h-10 [&_svg]:size-[18px]",
                            transactionsOpen && "text-foreground"
                          )}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                          <ChevronDown
                            className={cn(
                              "ml-auto size-4 transition-transform",
                              transactionsOpen && "rotate-180"
                            )}
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
                                  {child.badge ? (
                                    <Badge className="ml-auto h-[18px] min-w-[18px] rounded-full px-1 text-[10px]">
                                      {child.badge}
                                    </Badge>
                                  ) : null}
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
                    <SidebarMenuButton
                      asChild
                      isActive={item.active}
                      className="h-10 [&_svg]:size-[18px]"
                    >
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

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild className="h-10 [&_svg]:size-[18px]">
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
        <div className="mx-2 mb-2 rounded-xl bg-foreground p-5 text-background">
          <p className="mb-1 text-sm font-semibold">Upgrade to Pro!</p>
          <p className="mb-3 text-xs text-background/70">
            Full financial insights with analytics and graphs.
          </p>
          <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Upgrade now
          </Button>
        </div>

        <div className="flex items-center justify-between px-2 pb-2">
          <SidebarTrigger />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
