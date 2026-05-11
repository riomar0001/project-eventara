'use client';

import { useMemo, useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ── time options (30-min intervals, 12h format) ────────────────────────────────

function buildTimeOptions(): string[] {
  const times: string[] = [];
  for (let total = 0; total < 24 * 60; total += 30) {
    const h24 = Math.floor(total / 60);
    const m = total % 60;
    const period = h24 < 12 ? 'AM' : 'PM';
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    times.push(`${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`);
  }
  return times;
}

const TIME_OPTIONS = buildTimeOptions();

function toTimeOption(h24: number, m: number): string {
  const period = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

function parseTimeOption(opt: string): { h: number; m: number } {
  const [timePart, period] = opt.split(' ');
  const [hStr, mStr] = timePart.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (period === 'AM') {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }
  return { h, m };
}

// Floor to nearest 30-min slot so existing non-aligned values still select something
function snapDown(h24: number, m: number): string {
  const floored = Math.floor((h24 * 60 + m) / 30) * 30;
  return toTimeOption(Math.floor(floored / 60), floored % 60);
}

// ── date helpers ───────────────────────────────────────────────────────────────

function parseLocal(s: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

function toLocalStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

// ── component ──────────────────────────────────────────────────────────────────

interface DateTimePickerProps {
  value: string; // local datetime "YYYY-MM-DDTHH:mm" or ""
  onChange: (value: string) => void;
  minDatetime?: Date;
  maxDatetime?: Date;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  className?: string;
}

export function DateTimePicker({ value, onChange, minDatetime, maxDatetime, disabled, placeholder = 'Pick a date', id, className }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => parseLocal(value), [value]);

  const minDay = useMemo(() => {
    const today = startOfDay(new Date());
    if (!minDatetime) return today;
    const minD = startOfDay(minDatetime);
    return minD > today ? minD : today;
  }, [minDatetime]);

  const maxDay = useMemo(() => {
    if (!maxDatetime) return undefined;
    return startOfDay(maxDatetime);
  }, [maxDatetime]);

  // Current time as a 30-min-slot option string (floored so it always hits an option)
  const selectedTimeOption = useMemo(() => (selected ? snapDown(selected.getHours(), selected.getMinutes()) : undefined), [selected]);

  // Filter options to those within the min/max window on the selected day
  const availableOptions = useMemo(() => {
    if (!selected) return TIME_OPTIONS;
    let minMin = 0;
    let maxMin = 23 * 60 + 30;
    if (minDatetime && isSameDay(selected, minDatetime)) {
      minMin = Math.floor((minDatetime.getHours() * 60 + minDatetime.getMinutes()) / 30) * 30;
    }
    if (maxDatetime && isSameDay(selected, maxDatetime)) {
      maxMin = Math.floor((maxDatetime.getHours() * 60 + maxDatetime.getMinutes()) / 30) * 30;
    }
    return TIME_OPTIONS.filter((opt) => {
      const { h, m } = parseTimeOption(opt);
      const total = h * 60 + m;
      return total >= minMin && total <= maxMin;
    });
  }, [selected, minDatetime, maxDatetime]);

  const calendarDisabled = useMemo(() => {
    if (maxDay) return [{ before: minDay }, { after: maxDay }];
    return { before: minDay };
  }, [minDay, maxDay]);

  function handleDaySelect(day: Date | undefined) {
    if (!day) return;
    const merged = new Date(day);
    const h = selected?.getHours() ?? 0;
    const m = selected?.getMinutes() ?? 0;
    merged.setHours(h, m, 0, 0);

    if (minDatetime && isSameDay(merged, minDatetime) && merged < minDatetime) {
      merged.setHours(minDatetime.getHours(), minDatetime.getMinutes(), 0, 0);
    }
    if (maxDatetime && isSameDay(merged, maxDatetime) && merged > maxDatetime) {
      merged.setHours(maxDatetime.getHours(), maxDatetime.getMinutes(), 0, 0);
    }

    onChange(toLocalStr(merged));
    setOpen(false);
  }

  function handleTimeSelect(opt: string) {
    const { h, m } = parseTimeOption(opt);
    const base = selected ? new Date(selected) : new Date(minDay);
    base.setHours(h, m, 0, 0);
    if (minDatetime && base < minDatetime) return;
    if (maxDatetime && base > maxDatetime) return;
    onChange(toLocalStr(base));
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn('flex-1 justify-start text-left font-normal', !selected && 'text-muted-foreground')}
          >
            <CalendarIcon className="mr-2 size-4 shrink-0 opacity-50" />
            {selected ? formatDate(selected) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={selected} onSelect={handleDaySelect} disabled={calendarDisabled} autoFocus />
        </PopoverContent>
      </Popover>

      <Select value={selectedTimeOption} onValueChange={handleTimeSelect} disabled={disabled || !selected}>
        <SelectTrigger className="w-[118px] shrink-0">
          <SelectValue placeholder="Time" />
        </SelectTrigger>
        <SelectContent className="max-h-[280px]">
          {availableOptions.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
