import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// jsdom does not implement these browser APIs.
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// Used by Motion's whileInView / useInView. Report everything as visible immediately.
if (!('IntersectionObserver' in window)) {
  class MockIntersectionObserver {
    private readonly callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }
    observe(target: Element) {
      this.callback([{ isIntersecting: true, target, intersectionRatio: 1 } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = '';
    thresholds = [];
  }
  Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: MockIntersectionObserver });
  Object.defineProperty(globalThis, 'IntersectionObserver', { writable: true, value: MockIntersectionObserver });
}
