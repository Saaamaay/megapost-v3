import type { User, Session } from "@supabase/supabase-js";

let counter = 0;
function uid() {
  return `test-${++counter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createMockUser(overrides: Partial<User> = {}): User {
  const id = overrides.id ?? uid();
  return {
    id,
    email: `${id}@test.com`,
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    ...overrides,
  } as User;
}

export function createMockSession(overrides: Partial<Session> & { user?: Partial<User> } = {}): Session {
  const user = createMockUser(overrides.user);
  return {
    access_token: `token-${uid()}`,
    refresh_token: `refresh-${uid()}`,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user,
    ...overrides,
  } as Session;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockVoiceProfile(overrides: Record<string, any> = {}) {
  return {
    id: overrides.id ?? uid(),
    profileName: "Test Biz",
    business: "A test business",
    businessLocation: "London",
    employeeCount: "1-10",
    businessType: "Technology",
    toneScales: {
      casualProfessional: 3,
      funnySincere: 3,
      personalFormal: 3,
      groundedInspiring: 3,
    },
    samplePost: "Here is a sample post.",
    brandBeliefs: ["Quality", "Innovation"],
    isActive: true,
    lockedPlatform: null,
    ...overrides,
  };
}

// DB-shaped voice profile (as returned from supabase query)
export function createMockVoiceProfileRow(overrides: Record<string, any> = {}) {
  const id = overrides.id ?? uid();
  return {
    id,
    user_id: overrides.user_id ?? uid(),
    profile_name: "Test Biz",
    business_description: "A test business",
    business_location: "London",
    employee_count: "1-10",
    business_type: "Technology",
    tone_casual_professional: 3,
    tone_funny_sincere: 3,
    tone_personal_formal: 3,
    tone_grounded_inspiring: 3,
    example_post: "Here is a sample post.",
    brand_beliefs: ["Quality", "Innovation"],
    is_active: true,
    locked_platform: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockSubscriptionData(overrides: Record<string, any> = {}) {
  return {
    subscribed: false,
    product_id: null,
    subscription_end: null,
    cancel_at_period_end: false,
    user_created_at: new Date().toISOString(),
    trial_ineligible: false,
    ...overrides,
  };
}

export function createMockLinkedInConnection(overrides: Record<string, any> = {}) {
  return {
    id: overrides.id ?? uid(),
    linkedin_name: "Test User",
    linkedin_person_id: `li-${uid()}`,
    ...overrides,
  };
}

export function createMockContentPillar(overrides: Record<string, any> = {}) {
  return {
    id: overrides.id ?? uid(),
    title: "Content Marketing",
    description: "Tips and strategies for content marketing",
    emoji: "📝",
    ...overrides,
  };
}
