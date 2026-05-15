'use client';

import { Calendar } from 'lucide-react';
import Link from 'next/link';

export function MyEventsList() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-primary/10 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
        <Calendar size={24} className="text-primary" />
      </div>
      <p className="text-foreground text-lg font-semibold">No events yet</p>
      <p className="text-muted-foreground mt-1 text-sm">Events you register for will appear here.</p>
      <Link
        href="/events"
        className="bg-primary text-primary-foreground mt-5 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow)] transition-all hover:-translate-y-0.5"
      >
        Explore events
      </Link>
    </div>
  );
}
