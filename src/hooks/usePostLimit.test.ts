import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock useAuth and useSubscription before importing the hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: vi.fn(),
}));

// Also mock the supabase client since it's imported at module level
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {},
}));

import { usePostLimit } from "./usePostLimit";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

const mockUseAuth = vi.mocked(useAuth);
const mockUseSubscription = vi.mocked(useSubscription);

function mockSub(overrides: Record<string, any> = {}) {
  mockUseSubscription.mockReturnValue({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    cancelAtPeriodEnd: false,
    loading: false,
    tier: "free",
    isPaid: false,
    isPro: false,
    maxProfiles: 1,
    maxPlatforms: 1,
    trialExpired: false,
    trialDaysLeft: 7,
    trialEndsAt: new Date(Date.now() + 7 * 86400000),
    checkSubscription: vi.fn(),
    startCheckout: vi.fn(),
    openPortal: vi.fn(),
    ...overrides,
  } as any);
}

beforeEach(() => {
  mockUseAuth.mockReturnValue({ user: { id: "u1" } } as any);
  mockSub();
});

describe("usePostLimit", () => {
  it("allows generation for paid user", () => {
    mockSub({ isPaid: true, trialExpired: false });
    const { canGenerate, isPro } = usePostLimit();
    expect(canGenerate).toBe(true);
    expect(isPro).toBe(true);
  });

  it("allows generation for active trial user", () => {
    mockSub({ isPaid: false, trialExpired: false });
    const { canGenerate, isPro } = usePostLimit();
    expect(canGenerate).toBe(true);
    expect(isPro).toBe(false);
  });

  it("blocks generation when trial expired and unpaid", () => {
    mockSub({ isPaid: false, trialExpired: true });
    const { canGenerate, isPro } = usePostLimit();
    expect(canGenerate).toBe(false);
    expect(isPro).toBe(false);
  });

  it("passes through loading state from subscription", () => {
    mockSub({ loading: true });
    const { loading } = usePostLimit();
    expect(loading).toBe(true);
  });
});
