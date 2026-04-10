'use client';

import * as React from 'react';
import { ChevronDown, User, CreditCard, Settings, LogOut, Mail, Phone, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { Section } from './shared';

export function DropdownSection() {
  const [checkboxA, setCheckboxA] = React.useState(true);
  const [checkboxB, setCheckboxB] = React.useState(false);
  const [radioVal, setRadioVal] = React.useState('option-a');

  return (
    <Section title="Dropdown Menu">
      <Card>
        <CardContent className="flex flex-wrap gap-4 pt-2">
          {/* Basic */}
          <div className="flex flex-col gap-1.5">
            <p className="text-muted-foreground text-[10px]">Basic</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1.5">
                  Actions <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <User className="size-4" /> Profile <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard className="size-4" /> Billing <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="size-4" /> Settings <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <LogOut className="size-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Checkbox items */}
          <div className="flex flex-col gap-1.5">
            <p className="text-muted-foreground text-[10px]">Checkbox items</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1.5">
                  View options <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={checkboxA} onCheckedChange={setCheckboxA}>
                  Show amount
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={checkboxB} onCheckedChange={setCheckboxB}>
                  Show category
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Radio group */}
          <div className="flex flex-col gap-1.5">
            <p className="text-muted-foreground text-[10px]">Radio group</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1.5 capitalize">
                  {radioVal.replace('-', ' ')} <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={radioVal} onValueChange={setRadioVal}>
                  <DropdownMenuRadioItem value="option-a">Option A</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="option-b">Option B</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="option-c">Option C</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Sub menu */}
          <div className="flex flex-col gap-1.5">
            <p className="text-muted-foreground text-[10px]">Sub menu</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1.5">
                  More <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Mail className="size-4" /> Email
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Phone className="size-4" /> Share via
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Slack</DropdownMenuItem>
                    <DropdownMenuItem>Teams</DropdownMenuItem>
                    <DropdownMenuItem>WhatsApp</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Copy className="size-4" /> Copy link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </Section>
  );
}
