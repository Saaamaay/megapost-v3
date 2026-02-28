import "@testing-library/jest-dom";

// Polyfill crypto.randomUUID for jsdom
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      ...globalThis.crypto,
      randomUUID: () =>
        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
        }),
    },
  });
}

// Stub env vars that the Supabase client and LinkedIn hook read at import time
// Direct assignment works in vitest (import.meta.env is mutable at runtime)
import.meta.env.VITE_SUPABASE_URL = "https://test.supabase.co";
import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = "test-key";
import.meta.env.VITE_LINKEDIN_CLIENT_ID = "test-linkedin-client-id";

// matchMedia stub for components that use media queries
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
