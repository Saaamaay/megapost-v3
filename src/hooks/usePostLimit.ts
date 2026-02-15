import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

export function usePostLimit() {
  const { user } = useAuth();
  const { isPaid, loading: subLoading, trialExpired } = useSubscription();

  // Trial users get unlimited posts (server-side abuse caps still apply)
  // Only block generation when trial has expired and user hasn't subscribed
  const canGenerate = isPaid || !trialExpired;

  return {
    canGenerate,
    isPro: isPaid,
    loading: subLoading,
  };
}
