import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DeadlineCalendar } from './deadline-calendar';

describe('open-link closing-date copy', () => {
  it('explains both a chosen closing date and no date cutoff accurately', () => {
    const render = (noDeadline: boolean) =>
      renderToStaticMarkup(
        createElement(DeadlineCalendar, {
          mode: 'closes',
          noDeadline,
          value: '2026-11-28',
          onChange: () => {},
          onNoDeadlineChange: () => {},
        }),
      );
    expect(render(false)).toContain('After this date, the link stops taking payments.');
    expect(render(true)).toContain('There is no date cutoff.');
    expect(render(true)).not.toContain('After this date,');
  });
});
