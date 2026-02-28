import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mock supabase before imports
vi.mock("@/integrations/supabase/client", () => {
  const builder: any = {};
  for (const m of ["select", "eq", "order"]) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }
  builder.then = (r: any) => r({ data: null, error: null });

  return {
    supabase: {
      from: vi.fn().mockReturnValue(builder),
      // Needed because useAuth is imported at module level
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
      functions: { invoke: vi.fn() },
    },
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useContentPillars } from "./useContentPillars";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { createMockContentPillar } from "@/test/mocks/factories";

const mockUseAuth = vi.mocked(useAuth);

function setupPillarQuery(data: any[] | null, error: any = null) {
  const builder: any = {};
  for (const m of ["select", "eq", "order"]) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }
  builder.then = (r: any) => r({ data, error });
  vi.mocked(supabase.from).mockReturnValue(builder);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useContentPillars", () => {
  it("returns pillars when user and voiceProfile exist", async () => {
    const pillars = [
      createMockContentPillar({ title: "Marketing" }),
      createMockContentPillar({ title: "Sales" }),
    ];
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      voiceProfile: { id: "vp1" },
    } as any);
    setupPillarQuery(pillars);

    const { result } = renderHook(() => useContentPillars());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pillars).toHaveLength(2);
    expect(result.current.pillars[0].title).toBe("Marketing");
  });

  it("returns empty pillars without user", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      voiceProfile: null,
    } as any);

    const { result } = renderHook(() => useContentPillars());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pillars).toEqual([]);
  });

  it("returns empty pillars without voiceProfile", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      voiceProfile: null,
    } as any);

    const { result } = renderHook(() => useContentPillars());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pillars).toEqual([]);
  });

  it("getPlaceholder returns default when no pillars", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      voiceProfile: null,
    } as any);

    const { result } = renderHook(() => useContentPillars());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.getPlaceholder("fallback")).toBe("fallback");
  });

  it("getPlaceholder returns pillar-based text when pillars exist", async () => {
    const pillars = [createMockContentPillar({ title: "SEO Tips", description: "Boost rankings" })];
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      voiceProfile: { id: "vp1" },
    } as any);
    setupPillarQuery(pillars);

    const { result } = renderHook(() => useContentPillars());

    await waitFor(() => expect(result.current.pillars).toHaveLength(1));
    const text = result.current.getPlaceholder("fallback");
    expect(text).toContain("seo tips");
    expect(text).toContain("boost rankings");
  });
});
