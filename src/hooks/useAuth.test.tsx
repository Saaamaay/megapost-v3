import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { createMockSession, createMockVoiceProfileRow } from "@/test/mocks/factories";

// Build supabase mock
let authCallback: (event: string, session: any) => void;
const mockFrom = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockInvoke = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    auth: {
      getSession: (...args: any[]) => mockGetSession(...args),
      onAuthStateChange: vi.fn((cb: any) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signUp: (...args: any[]) => mockSignUp(...args),
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
    },
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

import { AuthProvider, useAuth } from "./useAuth";

// Consumer component to read auth context
function AuthConsumer() {
  const { user, loading, voiceProfile, allProfiles, signUp, signIn, signOut, saveVoiceProfile, switchProfile, deleteProfile } = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="user">{user?.id ?? "none"}</div>
      <div data-testid="profile">{voiceProfile?.profileName ?? "none"}</div>
      <div data-testid="profiles-count">{allProfiles.length}</div>
      <button data-testid="signup" onClick={() => signUp("t@t.com", "pass123")} />
      <button data-testid="signin" onClick={() => signIn("t@t.com", "pass123")} />
      <button data-testid="signout" onClick={() => signOut()} />
      <button data-testid="save-profile" onClick={() => saveVoiceProfile({
        profileName: "New",
        business: "Biz",
        businessLocation: "London",
        employeeCount: "1-10",
        businessType: "Tech",
        toneScales: { casualProfessional: 3, funnySincere: 3, personalFormal: 3, groundedInspiring: 3 },
        samplePost: "test",
        brandBeliefs: [],
      })} />
      <button data-testid="delete-profile" onClick={() => deleteProfile("vp1")} />
    </div>
  );
}

function chainBuilder(result: { data: any; error: any } = { data: null, error: null }) {
  const b: any = {};
  for (const m of ["select", "insert", "update", "delete", "eq", "order", "single", "maybeSingle"]) {
    b[m] = vi.fn().mockReturnValue(b);
  }
  b.then = (r: any) => r(result);
  return b;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  mockFrom.mockReturnValue(chainBuilder());
  mockSignOut.mockResolvedValue({ error: null });
  mockInvoke.mockResolvedValue({ data: {}, error: null });
});

describe("AuthProvider", () => {
  it("starts in loading state then resolves", async () => {
    render(
      <AuthProvider><AuthConsumer /></AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("hydrates session from getSession", async () => {
    const session = createMockSession({ user: { id: "u1", email: "t@t.com" } });
    const profileRow = createMockVoiceProfileRow({ user_id: "u1", profile_name: "My Biz" });

    mockGetSession.mockResolvedValue({ data: { session }, error: null });
    mockFrom.mockReturnValue(chainBuilder({ data: [profileRow], error: null }));

    render(
      <AuthProvider><AuthConsumer /></AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("u1");
    });
    await waitFor(() => {
      expect(screen.getByTestId("profile").textContent).toBe("My Biz");
    });
  });

  it("signUp calls supabase auth.signUp", async () => {
    mockSignUp.mockResolvedValue({ data: {}, error: null });

    render(
      <AuthProvider><AuthConsumer /></AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await act(async () => {
      screen.getByTestId("signup").click();
    });

    expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
      email: "t@t.com",
      password: "pass123",
    }));
  });

  it("signIn calls supabase auth.signInWithPassword", async () => {
    mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });

    render(
      <AuthProvider><AuthConsumer /></AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await act(async () => {
      screen.getByTestId("signin").click();
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "t@t.com",
      password: "pass123",
    });
  });

  it("signOut clears user and profiles", async () => {
    const session = createMockSession({ user: { id: "u1" } });
    mockGetSession.mockResolvedValue({ data: { session }, error: null });
    mockFrom.mockReturnValue(chainBuilder({ data: [createMockVoiceProfileRow()], error: null }));

    render(
      <AuthProvider><AuthConsumer /></AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("u1"));

    mockSignOut.mockResolvedValue({ error: null });
    await act(async () => {
      screen.getByTestId("signout").click();
    });

    expect(mockSignOut).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId("profile").textContent).toBe("none"));
  });

  it("saveVoiceProfile inserts when no profileId", async () => {
    const session = createMockSession({ user: { id: "u1" } });
    mockGetSession.mockResolvedValue({ data: { session }, error: null });
    mockFrom.mockReturnValue(chainBuilder({ data: [], error: null }));

    render(
      <AuthProvider><AuthConsumer /></AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("u1"));

    await act(async () => {
      screen.getByTestId("save-profile").click();
    });

    expect(mockFrom).toHaveBeenCalledWith("voice_profiles");
  });

  it("deleteProfile blocks deletion of last profile", async () => {
    const session = createMockSession({ user: { id: "u1" } });
    const profile = createMockVoiceProfileRow({ id: "vp1", user_id: "u1" });
    mockGetSession.mockResolvedValue({ data: { session }, error: null });
    mockFrom.mockReturnValue(chainBuilder({ data: [profile], error: null }));

    render(
      <AuthProvider><AuthConsumer /></AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("profiles-count").textContent).toBe("1"));

    await act(async () => {
      screen.getByTestId("delete-profile").click();
    });

    // Should NOT have called delete since it's the only profile
    // The function returns early with an error
    expect(screen.getByTestId("profiles-count").textContent).toBe("1");
  });

  it("sends welcome email on SIGNED_IN event", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    render(
      <AuthProvider><AuthConsumer /></AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    // Simulate auth state change
    const session = createMockSession({ user: { id: "u1", email: "test@example.com" } });
    await act(async () => {
      authCallback("SIGNED_IN", session);
      // Wait for setTimeout(fetchVoiceProfiles, 0)
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(mockInvoke).toHaveBeenCalledWith("send-welcome-email", {
      body: { email: "test@example.com" },
    });
  });
});
