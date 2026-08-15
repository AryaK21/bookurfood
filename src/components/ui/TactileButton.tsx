'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export type ButtonVariant = 'green' | 'red' | 'orange' | 'neutral' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'massive';

interface TactileButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function TactileButton({
  variant = 'green',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: TactileButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'green':
        return 'bg-[#22c55e] text-[#052e16] border-[#15803d] shadow-[0_5px_0_0_#15803d,0_10px_20px_rgba(34,197,94,0.35)] hover:bg-[#2adb6e] active:shadow-[0_2px_0_0_#15803d]';
      case 'red':
        return 'bg-[#ef4444] text-[#450a0a] border-[#991b1b] shadow-[0_5px_0_0_#991b1b,0_10px_20px_rgba(239,68,68,0.3)] hover:bg-[#f85656] active:shadow-[0_2px_0_0_#991b1b]';
      case 'orange':
        return 'bg-[#f97316] text-[#431407] border-[#c2410c] shadow-[0_5px_0_0_#c2410c,0_10px_20px_rgba(249,115,22,0.3)] hover:bg-[#fb923c] active:shadow-[0_2px_0_0_#c2410c]';
      case 'neutral':
        return 'bg-[#27272a] text-[#f4f4f5] border-[#18181b] shadow-[0_5px_0_0_#18181b,0_8px_16px_rgba(0,0,0,0.4)] hover:bg-[#323238] active:shadow-[0_2px_0_0_#18181b] border-t border-zinc-700/50';
      case 'outline':
        return 'bg-transparent text-zinc-300 border-zinc-700 shadow-[0_4px_0_0_#27272a] hover:bg-zinc-800/60 active:shadow-[0_1px_0_0_#27272a]';
      case 'ghost':
        return 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/5 border-transparent shadow-none';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 text-sm rounded-full font-semibold border-b-[3px]';
      case 'md':
        return 'px-6 py-3.5 text-base rounded-full font-bold border-b-[4px]';
      case 'lg':
        return 'px-8 py-4 text-lg rounded-[2rem] font-extrabold border-b-[5px] tracking-wide';
      case 'massive':
        return 'px-8 py-5 sm:py-6 text-xl sm:text-2xl rounded-[2.2rem] font-extrabold border-b-[6px] tracking-wider';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.015 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.96, y: 3 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      disabled={disabled || isLoading}
      className={`
        relative inline-flex items-center justify-center select-none cursor-pointer transition-colors duration-150
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed filter grayscale-[40%]' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2.5">
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </span>
      )}
    </motion.button>
  );
}
