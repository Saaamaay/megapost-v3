import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createTestQueryClient } from "@/test/wrappers";
import { QueryClientProvider } from "@tanstack/react-query";
import { createMockLinkedInConnection } from "@/test/mocks/factories";
import type { ReactNode } from "react";

// vi.hoisted variables are available inside vi.mock factories
const { mockToast, mockInvoke, mockFromFn } = vi.hoisted(() => ({
  mockToast: { error: vi.fn(), success: vi.fn() },
  mockInvoke: vi.fn(),
  mockFromFn: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: mockToast }));

vi.mock("@/integrations/supabase/client", () => {
  // Build default chainable builder inside factory
  const builder: any = {};
  for (const m of ["select", "eq", "maybeSingle"]) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }
  builder.then = (r: any) => r({ data: null, error: null });
  mockFromFn.mockReturnValue(builder);

  return {
    supabase: {
      from: mockFromFn,
      functions: { invoke: (...args: any[]) => mockInvoke(...args) },
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    },
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({ session: { user: { id: "u1" } } })),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

function wrapper({ children }: { children: ReactNode }) {
  const qc = createTestQueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  // Reset default from() builder
  const builder: any = {};
  for (const m of ["select", "eq", "maybeSingle"]) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }
  builder.then = (r: any) => r({ data: null, error: null });
  mockFromFn.mockReturnValue(builder);
});

describe("useLinkedIn", () => {
  it("isConnected is false when no connection", async () => {
    const { useLinkedIn } = await import("./useLinkedIn");
    const { result } = renderHook(() => useLinkedIn(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isConnected).toBe(false);
  });

  it("isConnected is true when connection exists", async () => {
    const conn = createMockLinkedInConnection();
    const builder: any = {};
    for (const m of ["select", "eq", "maybeSingle"]) {
      builder[m] = vi.fn().mockReturnValue(builder);
    }
    builder.then = (r: any) => r({ data: conn, error: null });
    mockFromFn.mockReturnValue(builder);

    const { useLinkedIn } = await import("./useLinkedIn");
    const { result } = renderHook(() => useLinkedIn(), { wrapper });

    await waitFor(() => expect(result.current.isConnected).toBe(true));
    expect(result.current.linkedinName).toBe("Test User");
  });

  it("connectLinkedIn sets sessionStorage state and redirects", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    // jsdom doesn't support navigation, so catch the href assignment
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, "location");
    let capturedHref = "";
    // @ts-ignore — overriding location for test
    delete (window as any).location;
    (window as any).location = {
      origin: "https://www.megapost.ai",
      href: "",
    };
    Object.defineProperty(window.location, "href", {
      set: (val: string) => { capturedHref = val; },
      get: () => capturedHref,
      configurable: true,
    });

    const { useLinkedIn } = await import("./useLinkedIn");
    const { result } = renderHook(() => useLinkedIn(), { wrapper });

    act(() => {
      result.current.connectLinkedIn();
    });

    expect(setItemSpy).toHaveBeenCalledWith(
      "linkedin_oauth_state",
      expect.any(String)
    );
    expect(capturedHref).toContain("linkedin.com/oauth/v2/authorization");
    expect(capturedHref).toContain("client_id=test-linkedin-client-id");

    setItemSpy.mockRestore();
    // Restore location
    if (originalDescriptor) {
      Object.defineProperty(window, "location", originalDescriptor);
    }
  });

  it("handleOAuthCallback rejects invalid state (CSRF)", async () => {
    sessionStorage.clear();

    const { useLinkedIn } = await import("./useLinkedIn");
    const { result } = renderHook(() => useLinkedIn(), { wrapper });

    let success: boolean;
    await act(async () => {
      success = await result.current.handleOAuthCallback("code123", "bad-state");
    });

    expect(success!).toBe(false);
    expect(mockToast.error).toHaveBeenCalledWith(
      "LinkedIn authentication failed (invalid state)"
    );
  });

  it("handleOAuthCallback succeeds with valid state", async () => {
    sessionStorage.setItem("linkedin_oauth_state", "valid-state");
    mockInvoke.mockResolvedValue({
      data: { linkedinName: "Sam M" },
      error: null,
    });

    const { useLinkedIn } = await import("./useLinkedIn");
    const { result } = renderHook(() => useLinkedIn(), { wrapper });

    let success: boolean;
    await act(async () => {
      success = await result.current.handleOAuthCallback("code123", "valid-state");
    });

    expect(success!).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith("linkedin-connect", {
      body: expect.objectContaining({ code: "code123" }),
    });
    expect(mockToast.success).toHaveBeenCalledWith("Connected as Sam M");
  });

  it("disconnectLinkedIn calls edge function", async () => {
    mockInvoke.mockResolvedValue({ data: {}, error: null });

    const { useLinkedIn } = await import("./useLinkedIn");
    const { result } = renderHook(() => useLinkedIn(), { wrapper });

    await act(async () => {
      await result.current.disconnectLinkedIn();
    });

    expect(mockInvoke).toHaveBeenCalledWith("linkedin-disconnect");
    expect(mockToast.success).toHaveBeenCalledWith("LinkedIn disconnected");
  });

  it("postToLinkedIn returns success with postUrl", async () => {
    mockInvoke.mockResolvedValue({
      data: { postUrl: "https://linkedin.com/post/123" },
      error: null,
    });

    const { useLinkedIn } = await import("./useLinkedIn");
    const { result } = renderHook(() => useLinkedIn(), { wrapper });

    let res: any;
    await act(async () => {
      res = await result.current.postToLinkedIn("post1", "Hello world");
    });

    expect(res.success).toBe(true);
    expect(res.postUrl).toBe("https://linkedin.com/post/123");
  });

  it("postToLinkedIn returns error on failure", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: "Network error" },
    });

    const { useLinkedIn } = await import("./useLinkedIn");
    const { result } = renderHook(() => useLinkedIn(), { wrapper });

    let res: any;
    await act(async () => {
      res = await result.current.postToLinkedIn("post1", "Hello world");
    });

    expect(res.success).toBe(false);
  });
});
