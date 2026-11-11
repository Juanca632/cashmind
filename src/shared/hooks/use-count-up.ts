import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

const DURATION_MS = 400;

type Shown = { key: string; value: number };

/** The amount shown at `progress` (0 to 1) of a count from `from` to `to`, in whole cents, easing out. */
export function countFrame(from: number, to: number, progress: number): number {
  if (progress >= 1) return to;
  if (progress <= 0) return from;
  const eased = 1 - (1 - progress) ** 3;
  return Math.round(from + (to - from) * eased);
}

/**
 * Shows `value` counting from the amount on screen when it changes for the same `key` (for example
 * the same month). On the first render, on a new key and with reduced motion it shows the value at once.
 */
export function useCountUp(value: number, key: string): number {
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState<Shown>({ key, value });
  // What is on screen right now, so an interrupted count continues from there.
  const onScreen = useRef<Shown>({ key, value });

  useEffect(() => {
    const show = (next: Shown) => {
      onScreen.current = next;
      setShown(next);
    };
    const from = onScreen.current;
    if (from.key !== key || reducedMotion) {
      show({ key, value });
      return;
    }
    if (from.value === value) return;
    const start = Date.now();
    let frame = requestAnimationFrame(function step() {
      const progress = (Date.now() - start) / DURATION_MS;
      show({ key, value: countFrame(from.value, value, progress) });
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [value, key, reducedMotion]);

  return shown.key === key ? shown.value : value;
}
