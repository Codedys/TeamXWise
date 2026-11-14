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

/** Geometry is shared by the SVG and the responsive touch hit area. */
export const DIAL_GEOMETRY = {
  width: 720,
  height: 360,
  centerX: 360,
  centerY: 400,
  radius: 330,
} as const;
export function dialPointerAngle(
  clientX: number,
  clientY: number,
  bounds: { left: number; top: number; width: number },
): number {
  if (bounds.width <= 0) return 0;
  const scale = bounds.width / DIAL_GEOMETRY.width;
  return (
    (Math.atan2(
      (clientY - bounds.top) / scale - DIAL_GEOMETRY.centerY,
      (clientX - bounds.left) / scale - DIAL_GEOMETRY.centerX,
    ) *
      180) /
    Math.PI
  );
}
