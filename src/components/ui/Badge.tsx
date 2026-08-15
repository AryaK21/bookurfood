'use client';

import React from 'react';

interface BadgeProps {
  variant?: 'green' | 'orange' | 'red' | 'zinc' | 'blue' | 'yellow';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = 'zinc',
  size = 'md',
  children,
  icon,
  className = '',
}: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'green':
        return 'bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30';
      case 'orange':
        return 'bg-[#f97316]/15 text-[#fb923c] border border-[#f97316]/30';
      case 'red':
        return 'bg-[#ef4444]/15 text-[#f87171] border border-[#ef4444]/30';
      case 'yellow':
        return 'bg-[#eab308]/15 text-[#fde047] border border-[#eab308]/30';
      case 'blue':
        return 'bg-[#3b82f6]/15 text-[#93c5fd] border border-[#3b82f6]/30';
      case 'zinc':
      default:
        return 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/60';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2.5 py-1';
      case 'md':
      default:
        return 'text-sm px-3.5 py-1.5';
    }
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-bold tracking-tight select-none
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
