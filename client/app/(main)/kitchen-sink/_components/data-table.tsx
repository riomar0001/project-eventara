'use client';

import * as React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Eye, Filter, MoreHorizontal, Pencil, Copy, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Section } from './shared';

type Transaction = {
  id: string;
  date: string;
  description: string;
  initials: string;
  category: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
};

const transactions: Transaction[] = [
  { id: '1', date: 'Apr 9, 2026', description: 'Netflix subscription', initials: 'NF', category: 'Entertainment', amount: -15.99, status: 'completed' },
  { id: '2', date: 'Apr 8, 2026', description: 'Salary deposit', initials: 'AC', category: 'Income', amount: 5200.0, status: 'completed' },
  { id: '3', date: 'Apr 7, 2026', description: 'Grocery store', initials: 'WM', category: 'Food', amount: -84.32, status: 'completed' },
  { id: '4', date: 'Apr 6, 2026', description: 'Electric bill', initials: 'EL', category: 'Housing', amount: -112.0, status: 'pending' },
  { id: '5', date: 'Apr 5, 2026', description: 'Transfer to savings', initials: 'BK', category: 'Savings', amount: -500.0, status: 'completed' },
  { id: '6', date: 'Apr 4, 2026', description: 'Gym membership', initials: 'GM', category: 'Healthcare', amount: -49.0, status: 'failed' },
  { id: '7', date: 'Apr 3, 2026', description: 'Freelance payment', initials: 'CL', category: 'Income', amount: 750.0, status: 'completed' },
  { id: '8', date: 'Apr 2, 2026', description: 'Uber ride', initials: 'UB', category: 'Transport', amount: -23.5, status: 'completed' }
];

const statusConfig: Record<Transaction['status'], { label: string; className: string }> = {
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700 border-green-200' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  failed: { label: 'Failed', className: 'bg-red-100   text-red-700   border-red-200' }
};

const columns = [
  { key: 'date' as const, label: 'Date' },
  { key: 'description' as const, label: 'Description' },
  { key: 'category' as const, label: 'Category' },
  { key: 'amount' as const, label: 'Amount' },
  { key: 'status' as const, label: 'Status' }
];

export function DataTable() {
  const [sort, setSort] = React.useState<{ col: keyof Transaction | null; dir: 'asc' | 'desc' }>({ col: null, dir: 'asc' });
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState('');

  const toggleSort = (col: keyof Transaction) =>
    setSort((prev) => (prev.col === col ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' }));

  const toggleStatus = (s: string) => setStatusFilter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const filtered = transactions
    .filter((t) => statusFilter.length === 0 || statusFilter.includes(t.status))
    .filter((t) => t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (!sort.col) return 0;
      const cmp = String(a[sort.col]) < String(b[sort.col]) ? -1 : String(a[sort.col]) > String(b[sort.col]) ? 1 : 0;
      return sort.dir === 'asc' ? cmp : -cmp;
    });

  function SortIcon({ col }: { col: keyof Transaction }) {
    if (sort.col !== col) return <ArrowUpDown className="size-3 opacity-40" />;
    return sort.dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
  }

  return (
    <Section title="Data Table">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              {filtered.length} of {transactions.length} records
            </CardDescription>
          </div>
          <CardAction>
            <div className="flex items-center gap-2">
              <Input className="h-8 w-40 text-xs" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Filter className="size-3.5" /> Filter
                    {statusFilter.length > 0 && <Badge className="ml-0.5 h-4 px-1 text-[10px]">{statusFilter.length}</Badge>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(['completed', 'pending', 'failed'] as const).map((s) => (
                    <DropdownMenuCheckboxItem key={s} checked={statusFilter.includes(s)} onCheckedChange={() => toggleStatus(s)} className="capitalize">
                      {s}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {statusFilter.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setStatusFilter([])}>Clear filters</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="size-3.5" /> Export
              </Button>
            </div>
          </CardAction>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground border-y text-xs">
                  {columns.map((col) => (
                    <th key={col.key} className="px-6 py-3 text-left font-medium">
                      <button className="hover:text-foreground flex items-center gap-1.5 transition-colors" onClick={() => toggleSort(col.key)}>
                        {col.label}
                        <SortIcon col={col.key} />
                      </button>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-muted-foreground px-6 py-10 text-center text-sm">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t, i) => (
                    <tr key={t.id} className={`hover:bg-muted/30 border-b transition-colors ${i % 2 !== 0 ? 'bg-muted/10' : ''}`}>
                      <td className="text-muted-foreground px-6 py-3.5 text-xs whitespace-nowrap">{t.date}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar size="sm">
                            <AvatarFallback className="text-[9px]">{t.initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{t.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge variant="outline" className="text-[10px]">
                          {t.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`text-xs font-semibold tabular-nums ${t.amount > 0 ? 'text-green-600' : 'text-foreground'}`}>
                          {t.amount > 0 ? '+' : ''}
                          {t.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge variant="outline" className={`text-[10px] ${statusConfig[t.status].className}`}>
                          {statusConfig[t.status].label}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-xs">
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="size-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil className="size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="size-4" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive">
                              <Trash2 className="size-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>

        <CardFooter className="text-muted-foreground border-t pt-4 text-xs">
          Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </CardFooter>
      </Card>
    </Section>
  );
}
