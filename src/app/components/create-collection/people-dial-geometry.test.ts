import { describe, expect, it } from 'vitest';
import {
  angleDelta,
  dialPointerAngle,
  clampPeople,
  peopleAfterRotation,
  wheelPeopleDelta,
} from './people-dial-geometry';

describe('people dial gestures', () => {
  it('uses the short angular distance when a pointer crosses the angle boundary', () => {
    expect(angleDelta(179, -179)).toBe(2);
    expect(angleDelta(-179, 179)).toBe(-2);
    expect(angleDelta(350, 10)).toBe(20);
  });
  it('turns six degrees into one person and clamps at the supported ends', () => {
    expect(peopleAfterRotation(12, -6)).toBe(13);
    expect(peopleAfterRotation(12, 6)).toBe(11);
    expect(peopleAfterRotation(12, 3)).toBe(11.5);
    expect(peopleAfterRotation(1, 100)).toBe(1);
    expect(peopleAfterRotation(500, -100)).toBe(500);
    expect(clampPeople(NaN)).toBe(12);
  });
  it('normalizes pixel, line and page wheel events including fine trackpad deltas', () => {
    expect(wheelPeopleDelta(40, 0)).toBe(1);
    expect(wheelPeopleDelta(-2.5, 1)).toBe(-1);
    expect(wheelPeopleDelta(1, 2)).toBe(10);
    expect(wheelPeopleDelta(4, 0)).toBe(0.1);
  });
  it('uses the same circular gesture geometry at phone and desktop sizes', () => {
    const desktop = dialPointerAngle(260, 120, { left: 0, top: 0, width: 720 });
    const scale = 342 / 720;
    const phone = dialPointerAngle(18 + 260 * scale, 200 + 120 * scale, {
      left: 18,
      top: 200,
      width: 342,
    });
    expect(phone).toBeCloseTo(desktop, 10);
    const desktopNext = dialPointerAngle(220, 140, { left: 0, top: 0, width: 720 });
    const phoneNext = dialPointerAngle(18 + 220 * scale, 200 + 140 * scale, {
      left: 18,
      top: 200,
      width: 342,
    });
    expect(peopleAfterRotation(12, angleDelta(phone, phoneNext))).toBeCloseTo(
      peopleAfterRotation(12, angleDelta(desktop, desktopNext)),
      10,
    );
    expect(dialPointerAngle(0, 0, { left: 0, top: 0, width: 0 })).toBe(0);
  });
});
