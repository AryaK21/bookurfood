'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface TactileCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'sunken' | 'green' | 'orange' | 'red';
  glow?: 'none' | 'green' | 'orange';
  children: React.ReactNode;
  className?: string;
}

export function TactileCard({
  variant = 'default',
  glow = 'none',
  children,
  className = '',
  ...props
}: TactileCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return 'bg-[#1a1a1a] border border-[#2c2c2c] border-b-[4px] border-b-[#141414] shadow-[0_8px_24px_rgba(0,0,0,0.4)]';
      case 'elevated':
        return 'bg-[#222222] border border-[#353535] border-b-[5px] border-b-[#161616] shadow-[0_12px_32px_rgba(0,0,0,0.55)]';
      case 'sunken':
        return 'bg-[#141414] border border-[#242424] shadow-inner';
      case 'green':
        return 'bg-gradient-to-b from-[#14301d] to-[#0d1e13] border border-[#22c55e]/40 border-b-[5px] border-b-[#15803d] shadow-[0_10px_30px_rgba(34,197,94,0.18)]';
      case 'orange':
        return 'bg-gradient-to-b from-[#2e1c10] to-[#1c120a] border border-[#f97316]/40 border-b-[5px] border-b-[#c2410c] shadow-[0_10px_30px_rgba(249,115,22,0.18)]';
      case 'red':
        return 'bg-gradient-to-b from-[#2e1111] to-[#1c0a0a] border border-[#ef4444]/40 border-b-[5px] border-b-[#991b1b] shadow-[0_10px_30px_rgba(239,68,68,0.18)]';
    }
  };

  const getGlowStyles = () => {
    switch (glow) {
      case 'green':
        return 'ring-1 ring-[#22c55e]/30 shadow-[0_0_40px_-5px_rgba(34,197,94,0.3)]';
      case 'orange':
        return 'ring-1 ring-[#f97316]/30 shadow-[0_0_40px_-5px_rgba(249,115,22,0.3)]';
      case 'none':
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`
        rounded-[2rem] p-5 sm:p-7 relative overflow-hidden transition-all
        ${getVariantStyles()}
        ${getGlowStyles()}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
}
