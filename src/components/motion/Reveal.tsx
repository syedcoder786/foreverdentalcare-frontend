import type { ReactNode } from 'react';
import { motion, type Variants } from 'motion/react';

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const VIEWPORT = { once: true, margin: '0px 0px -80px 0px' } as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Direction the element travels from. */
  from?: 'up' | 'left' | 'right' | 'none';
  as?: 'div' | 'section' | 'li' | 'article';
}

const offsets = { up: { y: 28 }, left: { x: -32 }, right: { x: 32 }, none: {} };

/** Fades and slides its content in the first time it scrolls into view. */
export function Reveal({ children, className, delay = 0, from = 'up', as = 'div' }: RevealProps) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, ...offsets[from] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.7, ease: EASE_OUT, delay }}
    >
      {children}
    </Component>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: (stagger: number = 0.08) => ({ transition: { staggerChildren: stagger, delayChildren: 0.05 } }),
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: EASE_OUT } },
};

/** Container whose <StaggerItem> children animate in one after another when scrolled into view. */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  as = 'div',
  immediate = false,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: 'div' | 'ul' | 'ol' | 'dl';
  /** Animate on mount instead of on scroll (e.g. above-the-fold content). */
  immediate?: boolean;
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      variants={containerVariants}
      custom={stagger}
      initial="hidden"
      {...(immediate ? { animate: 'show' } : { whileInView: 'show', viewport: VIEWPORT })}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({ children, className, as = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'li' | 'article' }) {
  const Component = motion[as];
  return (
    <Component className={className} variants={itemVariants}>
      {children}
    </Component>
  );
}
