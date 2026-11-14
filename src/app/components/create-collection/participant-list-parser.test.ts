import { describe, expect, it } from 'vitest';
import { parseParticipantList } from './participant-list-parser';

describe('participant list cleanup', () => {
  it('parses the supplied reference example into exactly twelve names', () => {
    const raw =
      'Trip list 3B:\n1. Mia Kask\n2. oliver tamm, Sofia Saar\n- Hugo Mets (hugo@example.com)\nEmma Ilves; Rasmus Lepik\nLaura Kuusk and Karl Rebane\nanna sepp\nMarten Oja, Liisa Pärn, Joonas Luik';
    expect(parseParticipantList(raw).names).toEqual([
      'Mia Kask',
      'Oliver Tamm',
      'Sofia Saar',
      'Hugo Mets',
      'Emma Ilves',
      'Rasmus Lepik',
      'Laura Kuusk',
      'Karl Rebane',
      'Anna Sepp',
      'Marten Oja',
      'Liisa Pärn',
      'Joonas Luik',
    ]);
    expect(parseParticipantList(raw).ignoredLines).toBe(1);
  });
  it('handles spreadsheet columns, bullets, accents and email-only lines', () => {
    expect(
      parseParticipantList(
        '• Õie Pärn\r\nANNA-MARIA SEPP\nÉmile Dubois\tAnne O’Neill\nname@example.com',
      ).names,
    ).toEqual(['Õie Pärn', 'Anna-Maria Sepp', 'Émile Dubois', 'Anne O’Neill']);
  });
  it('preserves duplicates for explicit correction rather than silently losing people', () => {
    expect(parseParticipantList('Anna Tamm\nAnna Tamm').names).toEqual([
      'Anna Tamm',
      'Anna Tamm',
    ]);
    expect(parseParticipantList('')).toEqual({ names: [], ignoredLines: 0 });
  });
  it.each([
    'Karl and Jaan are coming with Tiina.',
    'Karl and Jaan will come with Tiina!',
    'Karl and Jaan will be coming together with Tiina.',
    'Karl, Jaan, along with Tiina.',
    'Karl as well as Jaan plus Tiina',
    'Karl & Jaan ja Tiina',
    'Participants: Karl and Jaan are coming with Tiina.',
    'We’re coming: Karl and Jaan with Tiina.',
    'Karl is coming; Jaan will join; Tiina is attending too.',
    'Karl\tJaan\tTiina.',
  ])('separates names from common chat wording: %s', (raw) => {
    expect(parseParticipantList(raw).names).toEqual(['Karl', 'Jaan', 'Tiina']);
  });
  it('preserves full names, initials, accents and legitimate names that resemble words', () => {
    expect(
      parseParticipantList(
        'Will Smith and May Li are coming with Tiina de la Cruz.\nJ. R. Tolkien\nKarl R.\nAnna-Maria O’Neill\nO\u0303ie Pa\u0308rn',
      ).names,
    ).toEqual([
      'Will Smith',
      'May Li',
      'Tiina de la Cruz',
      'J. R. Tolkien',
      'Karl R.',
      'Anna-Maria O’Neill',
      'Õie Pärn',
    ]);
  });
  it('does not turn a negative attendance sentence into a name', () => {
    expect(
      parseParticipantList('Karl is not coming\nJaan won’t join\nTiina cannot come')
        .names,
    ).toEqual([]);
  });
  it('does not count leftover chatter, contact details or numbers as names', () => {
    expect(
      parseParticipantList(
        'Karl\nJaan might join later\nPlease bring snacks\nTiina is coming to the party\nThanks!\n123\n+372 555 1234\nname@example.com',
      ).names,
    ).toEqual(['Karl']);
  });
});
