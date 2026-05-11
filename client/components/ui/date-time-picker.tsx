'use client';

import { useMemo, useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// ── internal helpers ───────────────────────────────────────────────────────────

function parseLocal(s: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

function toLocalStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formatDisplay(d: Date): string {
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function toTimeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ── component ──────────────────────────────────────────────────────────────────

interface DateTimePickerProps {
  value: string; // local datetime "YYYY-MM-DDTHH:mm" or ""
  onChange: (value: string) => void;
  minDatetime?: Date; // disable datetimes strictly before this
  maxDatetime?: Date; // disable datetimes strictly after this
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  minDatetime,
  maxDatetime,
  disabled,
  placeholder = 'Pick a date & time',
  id,
  className
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => parseLocal(value), [value]);

  // Earliest selectable calendar day — never before today
  const minDay = useMemo(() => {
    const today = startOfDay(new Date());
    if (!minDatetime) return today;
    const minD = startOfDay(minDatetime);
    return minD > today ? minD : today;
  }, [minDatetime]);

  // Latest selectable calendar day
  const maxDay = useMemo(() => {
    if (!maxDatetime) return undefined;
    return startOfDay(maxDatetime);
  }, [maxDatetime]);

  // Time string for the <input type="time">
  const timeStr = selected ? toTimeStr(selected) : '00:00';

  // Minimum time for the time input (applies when selected day == minDatetime day)
  const minTimeStr = useMemo(() => {
    if (!selected || !minDatetime) return undefined;
    if (isSameDay(selected, minDatetime)) return toTimeStr(minDatetime);
    return undefined;
  }, [selected, minDatetime]);

  // Maximum time for the time input (applies when selected day == maxDatetime day)
  const maxTimeStr = useMemo(() => {
    if (!selected || !maxDatetime) return undefined;
    if (isSameDay(selected, maxDatetime)) return toTimeStr(maxDatetime);
    return undefined;
  }, [selected, maxDatetime]);

  function handleDaySelect(day: Date | undefined) {
    if (!day) return;
    const merged = new Date(day);
    const h = selected?.getHours() ?? 0;
    const m = selected?.getMinutes() ?? 0;
    merged.setHours(h, m, 0, 0);

    // Clamp forward to minDatetime when on the same day
    if (minDatetime && isSameDay(merged, minDatetime) && merged < minDatetime) {
      merged.setHours(minDatetime.getHours(), minDatetime.getMinutes(), 0, 0);
    }
    // Clamp backward to maxDatetime when on the same day
    if (maxDatetime && isSameDay(merged, maxDatetime) && merged > maxDatetime) {
      merged.setHours(maxDatetime.getHours(), maxDatetime.getMinutes(), 0, 0);
    }

    onChange(toLocalStr(merged));
  }

  function handleTimeChange(timeValue: string) {
    const [h, m] = timeValue.split(':').map(Number);
    const base = selected ? new Date(selected) : new Date(minDay);
    base.setHours(h, m, 0, 0);
    if (minDatetime && base < minDatetime) return;
    if (maxDatetime && base > maxDatetime) return;
    onChange(toLocalStr(base));
  }

  // Calendar disabled matcher: before minDay OR after maxDay
  const calendarDisabled = useMemo(() => {
    if (maxDay) return [{ before: minDay }, { after: maxDay }];
    return { before: minDay };
  }, [minDay, maxDay]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn('w-full justify-start text-left font-normal', !selected && 'text-muted-foreground', className)}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0 opacity-50" />
          {selected ? formatDisplay(selected) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={selected} onSelect={handleDaySelect} disabled={calendarDisabled} autoFocus />
        <div className="border-border border-t px-3 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground w-8 shrink-0 text-xs font-medium">Time</span>
            <Input type="time" value={timeStr} min={minTimeStr} max={maxTimeStr} onChange={(e) => handleTimeChange(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
