/**
 * Official Wise Check SVG path, @transferwise/icons 4.8.0.
 * Copyright 2020 TransferWise Ltd. Apache-2.0.
 * Adapted to a decorative SVG without the package wrapper; geometry is unchanged.
 * Source: https://unpkg.com/@transferwise/icons@4.8.0/build/components/check.tsx
 * License: public/licenses/wise-icons.txt
 */
export function WiseCheck({
  size = 24,
  className,
}: {
  size?: 16 | 24 | 32;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <path
        fillRule="evenodd"
        d="M9 16.586 20.293 5.293l1.414 1.414L9.714 18.7a1.01 1.01 0 0 1-1.428 0l-5.993-5.993 1.414-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}
