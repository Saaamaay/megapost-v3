import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

const FREE_POST_LIMIT = 1;

export function usePostLimit() {
  const { user } = useAuth();
  const { isPro, loading: subLoading } = useSubscription();
  const [postCount, setPostCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchPostCount = useCallback(async () => {
    if (!user) {
      setPostCount(0);
      setLoading(false);
      return;
    }

    try {
      const { count, error } = await supabase
        .from("generated_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to fetch post count:", error);
      } else {
        setPostCount(count ?? 0);
      }
    } catch (err) {
      console.error("Error fetching post count:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPostCount();
  }, [fetchPostCount]);

  const canGenerate = isPro || postCount < FREE_POST_LIMIT;
  const postsRemaining = Math.max(0, FREE_POST_LIMIT - postCount);

  return {
    postCount,
    canGenerate,
    postsRemaining,
    freeLimit: FREE_POST_LIMIT,
    isPro,
    loading: loading || subLoading,
    refreshCount: fetchPostCount,
  };
}
