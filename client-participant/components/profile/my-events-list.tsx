'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';

export function MyEventsList() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Calendar size={24} className="text-primary" />
      </div>
      <p className="text-lg font-semibold text-foreground">No events yet</p>
      <p className="mt-1 text-sm text-muted-foreground">Events you register for will appear here.</p>
      <Link href="/events"
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_28px_-10px_var(--lime-glow)] transition-all hover:-translate-y-0.5">
        Explore events
      </Link>
    </div>
  );
}
