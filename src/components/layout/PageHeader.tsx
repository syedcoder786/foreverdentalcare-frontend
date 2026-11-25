import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { EASE_OUT } from '../motion/Reveal';

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

/** Soft-tinted header band used at the top of inner public pages. */
export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-brand-50/70 to-surface dark:from-brand-500/[0.07] dark:to-transparent">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-sky-soft-100/60 blur-3xl dark:bg-sky-soft-500/15"
        animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/4 size-72 rounded-full bg-brand-100/50 blur-3xl dark:bg-brand-500/10"
        animate={{ x: [0, 40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="container-page relative py-14 sm:py-20"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        {eyebrow && (
          <motion.p variants={item} className="mb-3 text-xs font-semibold tracking-[0.16em] text-brand-700 uppercase dark:text-brand-300">
            {eyebrow}
          </motion.p>
        )}
        <motion.h1 variants={item} className="max-w-3xl font-display text-4xl leading-tight font-semibold text-ink sm:text-5xl">
          {title}
        </motion.h1>
        {description && (
          <motion.p variants={item} className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            {description}
          </motion.p>
        )}
        {children && (
          <motion.div variants={item} className="mt-8">
            {children}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
