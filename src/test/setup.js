import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global mock for IntersectionObserver required by Framer Motion in JSDOM
if (typeof window !== 'undefined') {
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.IntersectionObserver = MockIntersectionObserver;
  global.IntersectionObserver = MockIntersectionObserver;

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  }
}
