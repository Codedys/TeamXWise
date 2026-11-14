import { describe, expect, it } from 'vitest';
import { invitationShareText } from './share-collection';
describe('edited invitation sharing', () => {
  it('substitutes every link marker and keeps a URL when the owner removes the marker', () => {
    const url = 'https://example.com/chip-in/pay/demo';
    expect(invitationShareText('Welcome! [link]', url)).toBe(`Welcome! ${url}`);
    expect(invitationShareText('Welcome!', url)).toBe(`Welcome!\n\n${url}`);
    expect(invitationShareText(`Welcome! ${url}`, url)).toBe(`Welcome! ${url}`);
  });
});
