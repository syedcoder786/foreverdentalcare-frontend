import { AnimatePresence, motion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

/** Animated light/dark switch. The new theme expands as a circle from the button. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        toggleTheme({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
      title={isDark ? 'Light theme' : 'Dark theme'}
      className={cn(
        'relative inline-flex size-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-surface text-slate-600',
        'transition-colors hover:border-brand-300 hover:text-brand-700 dark:hover:shadow-glow',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: 18, rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
          exit={{ y: -18, rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          className="flex"
        >
          {isDark ? <Moon className="size-[18px] text-brand-300" aria-hidden /> : <Sun className="size-[18px] text-amber-500" aria-hidden />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
