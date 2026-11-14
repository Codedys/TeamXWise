export const MIN_PEOPLE = 1;
export const MAX_PEOPLE = 500;
export const DEGREES_PER_PERSON = 6;

export function clampPeople(value: number): number {
  return Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, Number.isFinite(value) ? value : 12));
}
export function angleDelta(previous: number, next: number): number {
  return ((next - previous + 540) % 360) - 180;
}
export function peopleAfterRotation(start: number, rotation: number): number {
  return clampPeople(start - rotation / DEGREES_PER_PERSON);
}
export function wheelPeopleDelta(delta: number, deltaMode: number): number {
  return (delta * (deltaMode === 1 ? 16 : deltaMode === 2 ? 400 : 1)) / 40;
}
