import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ContentPillar {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

export function useContentPillars() {
  const { user, voiceProfile } = useAuth();
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPillars = async () => {
      if (!user || !voiceProfile?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("content_pillars")
        .select("id, title, description, emoji")
        .eq("user_id", user.id)
        .eq("voice_profile_id", voiceProfile.id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setPillars(data);
      }
      setLoading(false);
    };

    fetchPillars();
  }, [user, voiceProfile?.id]);

  // Get a cycling placeholder based on pillars
  const getPlaceholder = (defaultPlaceholder: string): string => {
    if (pillars.length === 0) return defaultPlaceholder;
    
    // Cycle through pillars based on current time (changes every 10 seconds)
    const index = Math.floor(Date.now() / 10000) % pillars.length;
    const pillar = pillars[index];
    
    return `e.g., Something about "${pillar.title.toLowerCase()}" - ${pillar.description.toLowerCase()}...`;
  };

  return { pillars, loading, getPlaceholder };
}
