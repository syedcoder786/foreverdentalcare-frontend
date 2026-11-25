import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';

/** Animates a number from 0 (or its previous value) up to `value`. */
export function CountUp({ value, duration = 1.1 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    if (reduce) {
      node.textContent = String(value);
      previous.current = value;
      return;
    }
    const controls = animate(previous.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        node.textContent = Math.round(v).toLocaleString();
      },
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, inView, duration, reduce]);

  return (
    <span ref={ref} aria-label={String(value)}>
      {value}
    </span>
  );
}
