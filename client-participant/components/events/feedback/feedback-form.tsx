'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEventFeedback } from '@/hooks/events/use-event-feedback';
import { StarRating } from './star-rating';

type Props = { eventId: number; eventTitle: string };

export function FeedbackForm({ eventId, eventTitle }: Props) {
  const { rating, hovered, comment, submitting, submitted, setRating, setHovered, setComment, handleSubmit } = useEventFeedback();

  if (submitted) {
    return (
      <div className="border-border bg-card rounded-3xl border px-8 py-12 text-center shadow-xl">
        <div className="bg-primary/10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
          <CheckCircle2 size={32} className="text-primary" />
        </div>
        <h2 className="text-foreground text-2xl font-bold tracking-[-0.025em]">Thank you!</h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-[30ch] text-[13.5px]">Your feedback helps us improve every event.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href={`/events/${eventId}`}
            className="border-border text-muted-foreground hover:border-muted-foreground rounded-full border px-5 py-2.5 text-sm font-semibold transition-all"
          >
            Back to event
          </Link>
          <Link
            href="/events"
            className="bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow)] transition-all hover:-translate-y-0.5"
          >
            Browse events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border bg-card rounded-3xl border px-8 py-8 shadow-xl">
      <div className="mb-7">
        <span className="text-muted-foreground inline-flex items-center gap-2.5 font-mono text-xs tracking-widest uppercase">
          <span className="bg-primary h-1.5 w-1.5 rounded-full shadow-[0_0_12px_var(--lime-glow)]" />
          FEEDBACK
        </span>
        <h2 className="text-foreground mt-3 text-[22px] font-bold tracking-[-0.025em]">{eventTitle}</h2>
        <p className="text-muted-foreground mt-1 text-[13.5px]">How was your experience?</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <StarRating rating={rating} hovered={hovered} onRate={setRating} onHover={setHovered} />

        <div>
          <label className="text-muted-foreground mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase">
            Comment <span className="ml-1 normal-case opacity-60">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="What did you enjoy most? What could be improved?"
            className="border-border bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/10 w-full resize-none rounded-xl border px-4 py-3 transition-all focus:ring-2 focus:outline-none"
          />
          <div className="text-muted-foreground mt-1.5 flex items-center justify-between">
            <span className="text-[12px]">Anonymous · Your identity is not shared</span>
            <span className="font-mono text-[11px]">{comment.length}/2000</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="bg-primary text-primary-foreground flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
        >
          {submitting && <Loader2 size={15} className="animate-spin" />}
          {submitting ? 'Submitting…' : 'Submit feedback'}
        </button>
      </form>
    </div>
  );
}
