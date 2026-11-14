import { describe, expect, it } from 'vitest';
import { calendarMonth, dateFromInput, daysUntilDate, shortDeadline } from './calendar-date';

describe('deadline calendar', () => {
  it('lays out November 2026 with Monday-first columns as in the reference', () => {
    const month = calendarMonth(2026, 10);
    expect(month.slice(0, 6)).toEqual(Array(6).fill(null));
    expect(month[6]).toEqual({ date: '2026-11-01', day: 1 });
    expect(month[33]).toEqual({ date: '2026-11-28', day: 28 });
    expect(month.filter(Boolean)).toHaveLength(30);
    expect(month.length % 7).toBe(0);
  });
  it('handles leap years and rejects impossible dates', () => {
    expect(calendarMonth(2028, 1).filter(Boolean)).toHaveLength(29);
    expect(calendarMonth(2027, 1).filter(Boolean)).toHaveLength(28);
    expect(dateFromInput('2026-02-30')).toBeNull();
    expect(shortDeadline('2026-11-28')).toBe('28 Nov');
  });
  it('calculates calendar days across month and daylight-saving boundaries', () => {
    expect(daysUntilDate('2026-11-28', '2026-11-13')).toBe(15);
    expect(daysUntilDate('2026-03-30', '2026-03-28')).toBe(2);
    expect(daysUntilDate('2026-11-01', '2026-10-31')).toBe(1);
  });
});
