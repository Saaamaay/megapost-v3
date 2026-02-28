import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientWrapper, createTestQueryClient } from "@/test/wrappers";
import { QueryClientProvider } from "@tanstack/react-query";
import { createMockSubscriptionData } from "@/test/mocks/factories";
import { PLANS } from "./useSubscription";
import type { ReactNode } from "react";

// Mock supabase
const mockInvoke = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: (...args: any[]) => mockInvoke(...args) },
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), then: (r: any) => r({ data: null, error: null }) }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

// Mock useAuth to return a session
const mockSession = { user: { id: "u1" } };
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({ session: mockSession })),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

function wrapper({ children }: { children: ReactNode }) {
  const qc = createTestQueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useSubscription", () => {
  it("resolves free tier when not subscribed", async () => {
    mockInvoke.mockResolvedValue({
      data: createMockSubscriptionData(),
      error: null,
    });

    const { useSubscription } = await import("./useSubscription");
    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tier).toBe("free");
    expect(result.current.isPaid).toBe(false);
  });

  it("resolves standard tier", async () => {
    mockInvoke.mockResolvedValue({
      data: createMockSubscriptionData({
        subscribed: true,
        product_id: PLANS.standard.product_id,
      }),
      error: null,
    });

    const { useSubscription } = await import("./useSubscription");
    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tier).toBe("standard");
    expect(result.current.isPaid).toBe(true);
  });

  it("resolves premium tier", async () => {
    mockInvoke.mockResolvedValue({
      data: createMockSubscriptionData({
        subscribed: true,
        product_id: PLANS.premium.product_id,
      }),
      error: null,
    });

    const { useSubscription } = await import("./useSubscription");
    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tier).toBe("premium");
    expect(result.current.isPaid).toBe(true);
  });

  it("resolves professional tier", async () => {
    mockInvoke.mockResolvedValue({
      data: createMockSubscriptionData({
        subscribed: true,
        product_id: PLANS.professional.product_id,
      }),
      error: null,
    });

    const { useSubscription } = await import("./useSubscription");
    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tier).toBe("professional");
    expect(result.current.isPaid).toBe(true);
  });

  it("marks trial as expired after 7 days", async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 86400000).toISOString();
    mockInvoke.mockResolvedValue({
      data: createMockSubscriptionData({
        user_created_at: eightDaysAgo,
      }),
      error: null,
    });

    const { useSubscription } = await import("./useSubscription");
    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.trialExpired).toBe(true);
  });

  it("marks trial as not expired within 7 days", async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
    mockInvoke.mockResolvedValue({
      data: createMockSubscriptionData({
        user_created_at: twoDaysAgo,
      }),
      error: null,
    });

    const { useSubscription } = await import("./useSubscription");
    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.trialExpired).toBe(false);
    expect(result.current.trialDaysLeft).toBeGreaterThan(0);
  });

  it("shows loading while fetching", async () => {
    // Never resolve
    mockInvoke.mockReturnValue(new Promise(() => {}));

    const { useSubscription } = await import("./useSubscription");
    const { result } = renderHook(() => useSubscription(), { wrapper });

    expect(result.current.loading).toBe(true);
  });
});
