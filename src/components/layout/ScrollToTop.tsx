import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Scroll handling for route changes.
 *
 * Pages animate out before the next one mounts (see AnimatedOutlet), and most pages are lazy-loaded, so scrolling at
 * the moment the URL changes does not work: the old page is still on screen and the new page's #anchor does not exist
 * yet. Instead:
 *  - <ScrollOnEnter/> sits inside each page's transition wrapper and scrolls when the new page actually mounts:
 *    back/forward restores the old position, a #hash scrolls to that element, some pages scroll to their main
 *    content (e.g. /book to the booking form), everything else starts at the top.
 *  - <ScrollToTop/> sits in the layout and handles navigation that stays on the same page (a #hash link, or clicking
 *    the link of the page you are already on), and remembers scroll positions for back/forward.
 */

/** Pages that should open at a specific element instead of the very top (path -> element id). */
const DEFAULT_ANCHORS: Record<string, string> = {
  '/book': 'booking-form',
};

/** Saved scroll positions per history entry, for back/forward. */
const positions = new Map<string, number>();

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const normalise = (path: string) => (path.length > 1 ? path.replace(/\/$/, '') : path);

/** True when the element starts well below the top of the screen (so jumping to it is actually useful). */
function isBelowFold(el: Element) {
  return el.getBoundingClientRect().top > window.innerHeight * 0.35;
}

/**
 * Scrolls to a target, then keeps it in place for a moment while the page finishes loading (lazy chunks, data and
 * images change the layout above it). Stops as soon as the user scrolls on their own.
 */
function settleScroll(apply: () => boolean, { timeout = 2500 } = {}) {
  let done = false;
  let found = false;
  const start = performance.now();
  const stop = () => {
    done = true;
    observer.disconnect();
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((e) => window.removeEventListener(e, stop));
  };
  const observer =
    typeof ResizeObserver === 'undefined'
      ? { observe: () => undefined, disconnect: () => undefined }
      : new ResizeObserver(() => {
          if (!done && found) apply();
        });
  const tick = () => {
    if (done) return;
    if (!found) found = apply();
    if (found) observer.observe(document.body);
    if (performance.now() - start > timeout) return stop();
    if (!found) requestAnimationFrame(tick);
    else setTimeout(stop, Math.max(0, timeout - (performance.now() - start)));
  };
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((e) => window.addEventListener(e, stop, { passive: true }));
  tick();
  return stop;
}

const scrollToId = (id: string, behavior: ScrollBehavior) => () => {
  const el = document.getElementById(decodeURIComponent(id));
  if (!el) return false;
  el.scrollIntoView({ behavior, block: 'start' });
  return true;
};

/** Mount inside each page's transition wrapper: runs once when the new page enters. */
export function ScrollOnEnter() {
  const { pathname, hash, key } = useLocation();
  const navType = useNavigationType();

  useLayoutEffect(() => {
    const saved = positions.get(key);
    // Always start from the top so the new page never opens at the previous page's scroll position.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    if (navType === 'POP' && saved) {
      // Back/forward: wait until the page is tall enough, then restore.
      return settleScroll(() => {
        if (document.documentElement.scrollHeight < saved + window.innerHeight * 0.5) return false;
        window.scrollTo({ top: saved, behavior: 'instant' });
        return true;
      });
    }
    if (hash) return settleScroll(scrollToId(hash.slice(1), 'instant'));

    const anchor = DEFAULT_ANCHORS[normalise(pathname)];
    if (anchor) {
      return settleScroll(() => {
        const el = document.getElementById(anchor);
        if (!el) return false;
        if (isBelowFold(el) || window.scrollY > 0) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        return true;
      });
    }
    return undefined;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

/** Mount once in a layout: same-page navigation and scroll-position memory. */
export function ScrollToTop() {
  const location = useLocation();
  const prev = useRef(location);
  const keyRef = useRef(location.key);

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => positions.set(keyRef.current, window.scrollY));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    const before = prev.current;
    prev.current = location;
    keyRef.current = location.key;
    if (before.key === location.key) return;
    // A different page: <ScrollOnEnter/> handles it once that page mounts.
    if (before.pathname !== location.pathname) return;

    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
    if (location.hash) {
      settleScroll(scrollToId(location.hash.slice(1), behavior), { timeout: 800 });
      return;
    }
    // Clicked the link of the page already open (same URL): go back to its start.
    if (before.search === location.search && before.hash === location.hash) {
      const anchor = DEFAULT_ANCHORS[normalise(location.pathname)];
      const el = anchor ? document.getElementById(anchor) : null;
      if (el) el.scrollIntoView({ behavior, block: 'start' });
      else window.scrollTo({ top: 0, behavior });
    }
    // Only the query string changed (filters, tabs, pagination): keep the position.
  }, [location]);

  return null;
}
