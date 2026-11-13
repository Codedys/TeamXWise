import { describe, expect, it } from 'vitest';

import { Collection } from './collection.entity';
import { CollectionId } from '../value-objects/collection-id.vo';
import { Money } from '../value-objects/money.vo';
import { InvalidCollectionTitleError } from '../errors/invalid-collection-title.error';

const validProps = {
  id: CollectionId.create('11111111-1111-1111-1111-111111111111'),
  title: 'Ski trip 2026',
  targetAmount: Money.create(50000, 'EUR'),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('Collection', () => {
  it('creates a collection with valid props', () => {
    const collection = Collection.create(validProps);

    expect(collection.title).toBe('Ski trip 2026');
    expect(collection.targetAmount.minorUnits).toBe(50000);
    expect(collection.targetAmount.currency).toBe('EUR');
  });

  it('trims the title', () => {
    const collection = Collection.create({ ...validProps, title: '  Ski trip 2026  ' });

    expect(collection.title).toBe('Ski trip 2026');
  });

  it('rejects an empty title', () => {
    expect(() => Collection.create({ ...validProps, title: '   ' })).toThrow(
      InvalidCollectionTitleError,
    );
  });

  it('rejects a title longer than 120 characters', () => {
    expect(() => Collection.create({ ...validProps, title: 'a'.repeat(121) })).toThrow(
      InvalidCollectionTitleError,
    );
  });
});
