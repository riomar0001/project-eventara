'use client';

import { MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const payees = [
  { name: 'Davis', initials: 'DA' },
  { name: 'Eli', initials: 'EL' },
  { name: 'Leo', initials: 'LE' },
  { name: 'Amanda', initials: 'AM' },
  { name: 'Ann', initials: 'AN' },
  { name: 'Sin', initials: 'SI' }
];

export function QuickPayment() {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Quick payment</p>
        <Button variant="ghost" size="icon-xs">
          <MoreHorizontal className="size-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between">
        {payees.map((p) => (
          <div key={p.name} className="flex flex-col items-center gap-1">
            <Avatar className="hover:ring-primary size-11 cursor-pointer ring-2 ring-transparent transition">
              <AvatarFallback className="text-xs">{p.initials}</AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground text-[10px]">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
