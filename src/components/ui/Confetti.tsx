'use client';

import confetti from 'canvas-confetti';

export function triggerMealConfetti() {
  if (typeof window === 'undefined') return;

  const count = 120;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#22c55e', '#4ade80', '#15803d', '#ffffff'],
  });

  fire(0.2, {
    spread: 60,
    colors: ['#22c55e', '#86efac', '#eab308'],
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#22c55e', '#f97316', '#3b82f6'],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ['#4ade80', '#ffffff', '#22c55e'],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#22c55e', '#16a34a'],
  });
}
