'use client';

import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { StarRating } from './star-rating';
import { useEventFeedback } from '@/hooks/events/use-event-feedback';

type Props = { eventId: number; eventTitle: string };

export function FeedbackForm({ eventId, eventTitle }: Props) {
  const { rating, hovered, comment, submitting, submitted, setRating, setHovered, setComment, handleSubmit } = useEventFeedback();

  if (submitted) {
    return (
      <div className="rounded-3xl border border-border bg-card px-8 py-12 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <CheckCircle2 size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-[-0.025em] text-foreground">Thank you!</h2>
        <p className="mx-auto mt-2 max-w-[30ch] text-[13.5px] text-muted-foreground">Your feedback helps us improve every event.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={`/events/${eventId}`} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:border-muted-foreground">
            Back to event
          </Link>
          <Link href="/events" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_28px_-10px_var(--lime-glow)] transition-all hover:-translate-y-0.5">
            Browse events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card px-8 py-8 shadow-xl">
      <div className="mb-7">
        <span className="inline-flex items-center gap-2.5 font-mono text-xs tracking-widest text-muted-foreground uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--lime-glow)]" />
          FEEDBACK
        </span>
        <h2 className="mt-3 text-[22px] font-bold tracking-[-0.025em] text-foreground">{eventTitle}</h2>
        <p className="mt-1 text-[13.5px] text-muted-foreground">How was your experience?</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <StarRating rating={rating} hovered={hovered} onRate={setRating} onHover={setHovered} />

        <div>
          <label className="mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
            Comment <span className="ml-1 normal-case opacity-60">(optional)</span>
          </label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={2000}
            placeholder="What did you enjoy most? What could be improved?"
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none" />
          <div className="mt-1.5 flex items-center justify-between text-muted-foreground">
            <span className="text-[12px]">Anonymous · Your identity is not shared</span>
            <span className="font-mono text-[11px]">{comment.length}/2000</span>
          </div>
        </div>

        <button type="submit" disabled={submitting || rating === 0}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50">
          {submitting && <Loader2 size={15} className="animate-spin" />}
          {submitting ? 'Submitting…' : 'Submit feedback'}
        </button>
      </form>
    </div>
  );
}
