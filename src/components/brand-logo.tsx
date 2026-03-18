import React from "react";

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Expanded sidebar logo — chat bubble with a spark element.
 * Fills adapt to the active theme via CSS custom properties.
 */
export function BrandLogo({ size = 24, className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brand-grad-logo" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--info)" />
        </linearGradient>
      </defs>
      {/* Chat bubble */}
      <path
        d="M6 8a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4h-3l-4.5 4.5a1 1 0 0 1-1.5-.7V22H10a4 4 0 0 1-4-4V8Z"
        fill="url(#brand-grad-logo)"
      />
      {/* Spark / bolt — centered in bubble (cx≈16, cy≈13) */}
      <path
        d="M17 7l-5 8h3.5l-1 6.5 5.5-8.5H16.5L17 7Z"
        fill="var(--text-inverse)"
        opacity="0.92"
      />
    </svg>
  );
}

/**
 * Collapsed sidebar mark — compact square icon.
 * Same motif, tighter framing for small spaces.
 */
export function BrandMark({ size = 24, className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brand-grad-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--info)" />
        </linearGradient>
      </defs>
      {/* Rounded square base */}
      <rect x="3" y="3" width="26" height="26" rx="7" fill="url(#brand-grad-mark)" />
      {/* Spark / bolt — centered in square (cx=16, cy=16) */}
      <path
        d="M17 8.5l-5 8.5h3.5l-1 7 5.5-9H16.5L17 8.5Z"
        fill="var(--text-inverse)"
        opacity="0.92"
      />
    </svg>
  );
}
