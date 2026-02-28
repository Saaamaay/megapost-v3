import { vi } from "vitest";

// Chainable query builder mock
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createQueryBuilder(resolvedValue: { data: any; error: any } = { data: null, error: null }) {
  const builder: any = {};
  const chainMethods = [
    "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike",
    "is", "in", "contains", "containedBy", "range",
    "order", "limit", "single", "maybeSingle",
  ];

  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  // Terminal — resolves the promise
  builder.then = (resolve: any) => resolve(resolvedValue);

  return builder;
}

// Create a mock supabase client
export function createMockSupabase() {
  const queryBuilder = createQueryBuilder();

  const mockSupabase = {
    from: vi.fn().mockReturnValue(queryBuilder),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    // Helper to configure from().chain() responses
    __mockFromResponse(table: string, response: { data: any; error: any }) {
      const builder = createQueryBuilder(response);
      mockSupabase.from.mockImplementation((t: string) =>
        t === table ? builder : createQueryBuilder()
      );
      return builder;
    },
    // Helper to reset everything
    __reset() {
      vi.clearAllMocks();
      mockSupabase.from.mockReturnValue(createQueryBuilder());
    },
  };

  return mockSupabase;
}

// Singleton for module-level mock
export const mockSupabase = createMockSupabase();

// Default module mock — import this file then call vi.mock
vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));
