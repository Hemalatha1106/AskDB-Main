'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PremiumCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  elevated?: boolean;
  interactive?: boolean;
}

export function PremiumCard({
  className,
  glass = false,
  elevated = true,
  interactive = false,
  ...props
}: PremiumCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        glass
          ? 'glass'
          : 'bg-card border-border/40',
        elevated && 'shadow-sm',
        interactive &&
          'hover:shadow-md hover:border-border/80 cursor-pointer',
        className
      )}
      {...props}
    />
  );
}
