import { Suspense, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { EASE_OUT } from './Reveal';
import { PageLoader } from '../ui/Spinner';

/** Keeps the previous route's element mounted while it animates out. */
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen;
}

/** Route outlet with a fade/slide page transition. */
export function AnimatedOutlet({ offset = 14 }: { offset?: number }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: offset }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } }}
        exit={{ opacity: 0, y: -offset / 2, transition: { duration: 0.2, ease: 'easeIn' } }}
      >
        <Suspense fallback={<PageLoader />}>
          <FrozenOutlet />
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
