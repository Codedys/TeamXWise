'use client';

import { useRef, useState } from 'react';
import { WiseCheck } from '../icons/wise-check';
import { calendarMonth, dateFromInput, daysUntilDate, shortDeadline } from './calendar-date';
import { localDateInput } from './create-collection-draft';
import styles from './create-collection-wizard.module.css';

export function DeadlineCalendar({
  mode = 'pay-by',
  value,
  noDeadline,
  onChange,
  onNoDeadlineChange,
  error,
}: {
  mode?: 'pay-by' | 'closes';
  value: string;
  noDeadline: boolean;
  onChange: (date: string) => void;
  onNoDeadlineChange: (value: boolean) => void;
  error?: string;
}) {
  const today = localDateInput();
  const [month, setMonth] = useState(() => {
    const date = dateFromInput(value) ?? new Date();
    return { year: date.getFullYear(), index: date.getMonth() };
  });
  const calendarRef = useRef<HTMLDivElement>(null);
  const cells = calendarMonth(month.year, month.index);
  const selected = dateFromInput(value);
  const days = daysUntilDate(value, today);
  const monthTitle = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(month.year, month.index, 1, 12));

  function moveMonth(delta: number) {
    const next = new Date(month.year, month.index + delta, 1, 12);
    setMonth({ year: next.getFullYear(), index: next.getMonth() });
  }
  function choose(date: string) {
    onChange(date);
    onNoDeadlineChange(false);
  }
  function moveFocus(date: string, delta: number) {
    const next = dateFromInput(date);
    if (!next) return;
    next.setDate(next.getDate() + delta);
    const iso = localDateInput(next);
    if (iso < today) return;
    setMonth({ year: next.getFullYear(), index: next.getMonth() });
    requestAnimationFrame(() =>
      calendarRef.current?.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)?.focus(),
    );
  }

  return (
    <>
      <div className={styles.deadlineLayout}>
        <div className={styles.calendar} ref={calendarRef}>
          <div className={styles.calendarHeader}>
            <button
              type="button"
              aria-label="Previous month"
              disabled={
                new Date(month.year, month.index, 0, 12) < (dateFromInput(today) ?? new Date())
              }
              onClick={() => moveMonth(-1)}
            >
              ‹
            </button>
            <h2 aria-live="polite">{monthTitle}</h2>
            <button type="button" aria-label="Next month" onClick={() => moveMonth(1)}>
              ›
            </button>
          </div>
          <div className={styles.calendarGrid} role="group" aria-label={monthTitle}>
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
              <span key={day} className={styles.weekday} aria-hidden="true">
                {day}
              </span>
            ))}
            {cells.map((cell, index) =>
              cell ? (
                <button
                  key={cell.date}
                  type="button"
                  data-date={cell.date}
                  disabled={cell.date < today}
                  aria-label={new Intl.DateTimeFormat('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }).format(dateFromInput(cell.date)!)}
                  aria-pressed={!noDeadline && value === cell.date}
                  aria-current={cell.date === today ? 'date' : undefined}
                  className={`${styles.calendarDay} ${cell.date === today ? styles.today : ''}`}
                  onClick={() => choose(cell.date)}
                  onKeyDown={(event) => {
                    const moves: Record<string, number> = {
                      ArrowLeft: -1,
                      ArrowRight: 1,
                      ArrowUp: -7,
                      ArrowDown: 7,
                    };
                    if (event.key in moves) {
                      event.preventDefault();
                      moveFocus(cell.date, moves[event.key]);
                    }
                  }}
                >
                  {cell.day}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>
        </div>
        <div className={styles.deadlineAside}>
          <div className={styles.deadlineCard} aria-live="polite">
            <h3>{mode === 'closes' ? 'The link closes on' : 'Everyone pays by'}</h3>
            <p>
              {noDeadline
                ? mode === 'closes'
                  ? 'No closing date'
                  : 'No deadline'
                : shortDeadline(value)}
            </p>
            <span>
              {noDeadline
                ? mode === 'closes'
                  ? 'Until its limit is reached, or you close it'
                  : 'Contribute when ready'
                : selected
                  ? `${new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(selected)} · ${days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}`
                  : 'Pick a date on the calendar'}
            </span>
          </div>
          <p className={styles.calendarHelp}>
            {mode === 'closes'
              ? noDeadline
                ? 'There is no date cutoff. Your limit still applies, and you can close the link yourself.'
                : 'After this date, the link stops taking payments. A spot limit or goal may close it sooner.'
              : 'Give everyone a clear date to aim for, so you don’t have to chase.'}
          </p>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={noDeadline}
              onChange={(event) => onNoDeadlineChange(event.target.checked)}
            />
            <span className={styles.checkboxMark} aria-hidden="true">
              {noDeadline && <WiseCheck size={16} />}
            </span>
            <span>{mode === 'closes' ? 'No closing date' : 'No deadline'}</span>
          </label>
        </div>
      </div>
      <input type="hidden" name="deadline" value={value} />
      {error && (
        <p id="error-deadline" role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </>
  );
}
