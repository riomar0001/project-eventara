/**
 * Icon component wrapper for common icons
 */
import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 20, className = '' }: IconProps) {
  const iconSize = size;
  const strokeWidth = 2;
  const baseClass = `w-${size} h-${size} ${className}`;

  // Simple SVG icons - expand as needed
  const icons: { [key: string]: React.ReactNode } = {
    search: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    chevronDown: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    ),
    plus: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    moreVertical: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    ),
    mapPin: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    users: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    star: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={strokeWidth}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    x: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    wifi: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M9 20h6" />
        <path d="M12 17v3" />
      </svg>
    ),
    car: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
        <path d="M18 8h1a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-10a4 4 0 0 1 4-4h1M9 4h6M9 9h6" />
      </svg>
    ),
    chevronLeft: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
        <polyline points="15 18 9 12 15 6" />
      </svg>
    ),
    chevronRight: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    )
  };

  return (
    <span className={baseClass}>
      {icons[name] || (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
      )}
    </span>
  );
}
