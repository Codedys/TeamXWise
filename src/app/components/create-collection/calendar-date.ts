import { localDateInput } from './create-collection-draft';

export interface CalendarCell {
  date: string;
  day: number;
}
export function dateFromInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const result = new Date(year, month - 1, day, 12);
  return result.getFullYear() === year &&
    result.getMonth() === month - 1 &&
    result.getDate() === day
    ? result
    : null;
}
export function calendarMonth(year: number, month: number): (CalendarCell | null)[] {
  const first = new Date(year, month, 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const length = new Date(year, month + 1, 0, 12).getDate();
  return Array.from({ length: Math.ceil((offset + length) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= length
      ? { day, date: localDateInput(new Date(year, month, day, 12)) }
      : null;
  });
}
/** Calendar-day difference, independent of daylight-saving hour changes. */
export function daysUntilDate(value: string, today: string): number {
  const selected = dateFromInput(value),
    current = dateFromInput(today);
  if (!selected || !current) return 0;
  const utc = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((utc(selected) - utc(current)) / 86_400_000);
}
export function shortDeadline(value: string): string {
  const date = dateFromInput(value);
  return date
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date)
    : 'Choose a date';
}
