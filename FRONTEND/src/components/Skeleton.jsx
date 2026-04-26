import React from 'react';

export default function Skeleton({ className = '', variant = 'rectangular', ...props }) {
  let roundedClass = 'rounded-xl';
  if (variant === 'circular') {
    roundedClass = 'rounded-full';
  } else if (variant === 'text') {
    roundedClass = 'rounded';
  }

  return (
    <div
      className={`animate-pulse bg-surface-elevated border border-border-default ${roundedClass} ${className}`}
      {...props}
    />
  );
}
