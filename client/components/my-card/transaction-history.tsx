'use client';

import { ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const transactions = [
  { id: 1, name: 'Dividend payout', date: '25 Feb 2025', amount: '+$1,100', status: 'Completed', initials: 'DP', color: 'bg-green-100 text-green-700' },
  { id: 2, name: 'Corporate subscriptions', date: '25 Feb 2025', amount: '-$6,400', status: 'Declined', initials: 'CS', color: 'bg-blue-100 text-blue-700' },
  { id: 3, name: 'Investment in ETF', date: '21 Feb 2025', amount: '-$900', status: 'Completed', initials: 'IE', color: 'bg-purple-100 text-purple-700' },
  { id: 4, name: 'Consulting services', date: '21 Feb 2025', amount: '-$2,100', status: 'Completed', initials: 'CN', color: 'bg-orange-100 text-orange-700' },
  { id: 5, name: 'Equipment purchase', date: '20 Feb 2025', amount: '-$1,700', status: 'Completed', initials: 'EP', color: 'bg-yellow-100 text-yellow-700' },
  { id: 6, name: 'Elli Harper', date: '15 Feb 2025', amount: '+$600', status: 'Completed', initials: 'EH', color: 'bg-pink-100 text-pink-700' },
  { id: 7, name: 'Davis Rowen', date: '15 Feb 2025', amount: '+$800', status: 'Completed', initials: 'DR', color: 'bg-teal-100 text-teal-700' }
];

export function TransactionHistory() {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Transaction history</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="xs" className="gap-1">
              7d <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>7d</DropdownMenuItem>
            <DropdownMenuItem>30d</DropdownMenuItem>
            <DropdownMenuItem>90d</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Column headers */}
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-muted-foreground text-[10px]">Name</span>
        <span className="text-muted-foreground text-[10px]">Amount</span>
      </div>

      <ScrollArea className="h-80">
        <div className="flex flex-col gap-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-2.5">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className={cn('text-[10px]', tx.color)}>{tx.initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{tx.name}</p>
                <p className="text-muted-foreground text-[10px]">{tx.date}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className={cn('text-xs font-semibold', tx.amount.startsWith('+') ? 'text-green-600' : 'text-foreground')}>{tx.amount}</span>
                <Badge
                  variant="secondary"
                  className={cn('h-4 px-1 text-[9px]', tx.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}
                >
                  {tx.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
