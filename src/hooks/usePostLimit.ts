import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

const FREE_DAILY_LIMIT = 3;

export function usePostLimit() {
  const { user } = useAuth();
  const { isPaid, loading: subLoading, trialExpired } = useSubscription();
  const [todayCount, setTodayCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchTodayCount = useCallback(async () => {
    if (!user) {
      setTodayCount(0);
      setLoading(false);
      return;
    }

    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from("generated_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfDay.toISOString());

      if (error) {
        console.error("Failed to fetch post count:", error);
      } else {
        setTodayCount(count ?? 0);
      }
    } catch (err) {
      console.error("Error fetching post count:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTodayCount();
  }, [fetchTodayCount]);

  const canGenerate = isPaid || (!trialExpired && todayCount < FREE_DAILY_LIMIT);
  const postsRemaining = isPaid ? Infinity : trialExpired ? 0 : Math.max(0, FREE_DAILY_LIMIT - todayCount);

  return {
    postCount: todayCount,
    canGenerate,
    postsRemaining,
    freeLimit: FREE_DAILY_LIMIT,
    isPro: isPaid,
    loading: loading || subLoading,
    refreshCount: fetchTodayCount,
  };
}
