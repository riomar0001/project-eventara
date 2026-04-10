'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Section } from './shared';

export function CollapsibleSection() {
  const [open, setOpen] = React.useState(false);

  return (
    <Section title="Collapsible">
      <Card>
        <CardContent className="pt-2">
          <Collapsible open={open} onOpenChange={setOpen} className="max-w-sm">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between gap-2">
                Transaction filters
                <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-muted/30 mt-2 flex flex-col gap-2 rounded-xl border p-4">
                <Input placeholder="Search by merchant…" />
                <Input placeholder="Min amount" type="number" />
                <Input placeholder="Max amount" type="number" />
                <Button size="sm" className="mt-1">
                  Apply
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </Section>
  );
}
