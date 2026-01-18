import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface ToneScales {
  casualProfessional: number;
  funnySincere: number;
  personalFormal: number;
  groundedInspiring: number;
}

interface VoiceProfile {
  id: string;
  business: string;
  businessLocation: string;
  employeeCount: string;
  businessType: string;
  toneScales: ToneScales;
  samplePost: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  voiceProfile: VoiceProfile | null;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  saveVoiceProfile: (profile: Omit<VoiceProfile, "id">) => Promise<{ error: Error | null }>;
  refetchVoiceProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);

  const fetchVoiceProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("voice_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data && !error) {
      setVoiceProfile({
        id: data.id,
        business: data.business_description || "",
        businessLocation: data.business_location || "",
        employeeCount: data.employee_count || "",
        businessType: data.business_type || "",
        toneScales: {
          casualProfessional: data.tone_casual_professional ?? 3,
          funnySincere: data.tone_funny_sincere ?? 3,
          personalFormal: data.tone_personal_formal ?? 3,
          groundedInspiring: data.tone_grounded_inspiring ?? 3,
        },
        samplePost: data.example_post || "",
      });
    } else {
      setVoiceProfile(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Defer voice profile fetch
        if (session?.user) {
          setTimeout(() => {
            fetchVoiceProfile(session.user.id);
          }, 0);
        } else {
          setVoiceProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        fetchVoiceProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setVoiceProfile(null);
  };

  const saveVoiceProfile = async (profile: Omit<VoiceProfile, "id">) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase.from("voice_profiles").upsert(
      {
        user_id: user.id,
        business_description: profile.business,
        business_location: profile.businessLocation,
        employee_count: profile.employeeCount,
        business_type: profile.businessType,
        tone_casual_professional: profile.toneScales.casualProfessional,
        tone_funny_sincere: profile.toneScales.funnySincere,
        tone_personal_formal: profile.toneScales.personalFormal,
        tone_grounded_inspiring: profile.toneScales.groundedInspiring,
        example_post: profile.samplePost,
      },
      { onConflict: "user_id" }
    );

    if (!error) {
      await fetchVoiceProfile(user.id);
    }

    return { error: error as Error | null };
  };

  const refetchVoiceProfile = async () => {
    if (user) {
      await fetchVoiceProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        voiceProfile,
        signUp,
        signIn,
        signOut,
        saveVoiceProfile,
        refetchVoiceProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
