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
  profileName: string;
  business: string;
  businessLocation: string;
  employeeCount: string;
  businessType: string;
  toneScales: ToneScales;
  samplePost: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  voiceProfile: VoiceProfile | null;
  allProfiles: VoiceProfile[];
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  saveVoiceProfile: (profile: Omit<VoiceProfile, "id" | "isActive">, profileId?: string) => Promise<{ error: Error | null }>;
  switchProfile: (profileId: string) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<{ error: Error | null }>;
  refetchVoiceProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapDbToProfile(data: any): VoiceProfile {
  return {
    id: data.id,
    profileName: data.profile_name || data.business_type || "My Business",
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
    isActive: data.is_active ?? false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<VoiceProfile[]>([]);

  const fetchVoiceProfiles = async (userId: string) => {
    const { data, error } = await supabase
      .from("voice_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (data && !error) {
      const profiles = data.map(mapDbToProfile);
      setAllProfiles(profiles);
      
      // Find active profile, or use first one
      const activeProfile = profiles.find(p => p.isActive) || profiles[0] || null;
      setVoiceProfile(activeProfile);
    } else {
      setVoiceProfile(null);
      setAllProfiles([]);
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
            fetchVoiceProfiles(session.user.id);
          }, 0);
        } else {
          setVoiceProfile(null);
          setAllProfiles([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        fetchVoiceProfiles(session.user.id);
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
    setAllProfiles([]);
  };

  const saveVoiceProfile = async (profile: Omit<VoiceProfile, "id" | "isActive">, profileId?: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const profileData = {
      user_id: user.id,
      profile_name: profile.profileName,
      business_description: profile.business,
      business_location: profile.businessLocation,
      employee_count: profile.employeeCount,
      business_type: profile.businessType,
      tone_casual_professional: profile.toneScales.casualProfessional,
      tone_funny_sincere: profile.toneScales.funnySincere,
      tone_personal_formal: profile.toneScales.personalFormal,
      tone_grounded_inspiring: profile.toneScales.groundedInspiring,
      example_post: profile.samplePost,
    };

    let error;

    if (profileId) {
      // Update existing profile
      const result = await supabase
        .from("voice_profiles")
        .update(profileData)
        .eq("id", profileId)
        .eq("user_id", user.id);
      error = result.error;
    } else {
      // Create new profile and set as active
      const result = await supabase
        .from("voice_profiles")
        .insert({ ...profileData, is_active: true });
      error = result.error;
    }

    if (!error) {
      await fetchVoiceProfiles(user.id);
    }

    return { error: error as Error | null };
  };

  const switchProfile = async (profileId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("voice_profiles")
      .update({ is_active: true })
      .eq("id", profileId)
      .eq("user_id", user.id);

    if (!error) {
      await fetchVoiceProfiles(user.id);
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    // Don't allow deleting the last profile
    if (allProfiles.length <= 1) {
      return { error: new Error("Cannot delete your only profile") };
    }

    const { error } = await supabase
      .from("voice_profiles")
      .delete()
      .eq("id", profileId)
      .eq("user_id", user.id);

    if (!error) {
      // If we deleted the active profile, make another one active
      const deletedProfile = allProfiles.find(p => p.id === profileId);
      if (deletedProfile?.isActive) {
        const remaining = allProfiles.filter(p => p.id !== profileId);
        if (remaining.length > 0) {
          await supabase
            .from("voice_profiles")
            .update({ is_active: true })
            .eq("id", remaining[0].id)
            .eq("user_id", user.id);
        }
      }
      await fetchVoiceProfiles(user.id);
    }

    return { error: error as Error | null };
  };

  const refetchVoiceProfile = async () => {
    if (user) {
      await fetchVoiceProfiles(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        voiceProfile,
        allProfiles,
        signUp,
        signIn,
        signOut,
        saveVoiceProfile,
        switchProfile,
        deleteProfile,
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
