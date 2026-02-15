import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SubscriptionTier = "free" | "standard" | "premium" | "professional";

export interface PlanConfig {
  price_id: string;
  product_id: string;
  name: string;
  price: string;
  interval: string;
  maxProfiles: number;
  maxPlatforms: number;
}

export const PLANS: Record<Exclude<SubscriptionTier, "free">, PlanConfig> = {
  standard: {
    price_id: "price_1T18qsCYzAdXKBHt1wgq6e6s",
    product_id: "prod_Tz75rum2BC2w3m",
    name: "Standard",
    price: "£10",
    interval: "month",
    maxProfiles: 1,
    maxPlatforms: 1,
  },
  premium: {
    price_id: "price_1T07zqCYzAdXKBHty3g6o67K",
    product_id: "prod_Ty48vtBStymfFT",
    name: "Premium",
    price: "£20",
    interval: "month",
    maxProfiles: 1,
    maxPlatforms: 5,
  },
  professional: {
    price_id: "price_1T18rACYzAdXKBHta3HGFKEu",
    product_id: "prod_Tz750SlWIfTKtU",
    name: "Professional",
    price: "£30",
    interval: "month",
    maxProfiles: 3,
    maxPlatforms: 5,
  },
} as const;

export const FREE_PLAN = {
  name: "Free",
  price: "£0",
  maxProfiles: 1,
  maxPlatforms: 1,
  maxPostsPerDay: 3,
  trialDays: 7,
} as const;

function resolveTier(subscribed: boolean, productId: string | null): SubscriptionTier {
  if (!subscribed || !productId) return "free";
  for (const [tier, plan] of Object.entries(PLANS)) {
    if (plan.product_id === productId) return tier as SubscriptionTier;
  }
  return "free";
}

interface SubscriptionData {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
  user_created_at: string | null;
  trial_ineligible: boolean;
}

async function fetchSubscription(): Promise<SubscriptionData> {
  const { data, error } = await supabase.functions.invoke("check-subscription");
  if (error) {
    const msg = typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error);
    if (msg.includes("Unauthorized") || msg.includes("Auth session missing") || msg.includes("401")) {
      return { subscribed: false, product_id: null, subscription_end: null, user_created_at: null, trial_ineligible: false };
    }
    throw error;
  }
  return {
    subscribed: data.subscribed ?? false,
    product_id: data.product_id ?? null,
    subscription_end: data.subscription_end ?? null,
    user_created_at: data.user_created_at ?? null,
    trial_ineligible: data.trial_ineligible ?? false,
  };
}

export function useSubscription() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["subscription", session?.user?.id],
    queryFn: fetchSubscription,
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60_000,
  });

  const subscribed = data?.subscribed ?? false;
  const productId = data?.product_id ?? null;
  const subscriptionEnd = data?.subscription_end ?? null;
  const userCreatedAt = data?.user_created_at ?? null;
  const trialIneligible = data?.trial_ineligible ?? false;
  const tier = resolveTier(subscribed, productId);

  const isPaid = tier !== "free";
  const currentPlan = tier === "free" ? null : PLANS[tier];

  // Trial logic: 7 days from signup, but ineligible if previously deleted account
  const trialEndsAt = userCreatedAt
    ? new Date(new Date(userCreatedAt).getTime() + FREE_PLAN.trialDays * 24 * 60 * 60 * 1000)
    : null;
  const trialExpired = !isPaid && (trialIneligible || (trialEndsAt ? new Date() > trialEndsAt : false));
  const inTrial = !isPaid && !trialExpired;

  // Trial users get Premium-level access
  const maxProfiles = currentPlan?.maxProfiles ?? (inTrial ? PLANS.premium.maxProfiles : FREE_PLAN.maxProfiles);
  const maxPlatforms = currentPlan?.maxPlatforms ?? (inTrial ? PLANS.premium.maxPlatforms : FREE_PLAN.maxPlatforms);

  const trialDaysLeft = !isPaid && trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  const checkSubscription = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
  }, [queryClient]);

  const startCheckout = async (priceId?: string) => {
    const id = priceId ?? PLANS.premium.price_id;
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId: id },
    });
    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url;
    }
  };

  const openPortal = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, "_blank");
    }
  };

  return {
    subscribed,
    productId,
    subscriptionEnd,
    loading: !session ? false : isLoading,
    tier,
    isPaid,
    isPro: isPaid, // backward compat
    maxProfiles,
    maxPlatforms,
    trialExpired,
    trialDaysLeft,
    trialEndsAt,
    checkSubscription,
    startCheckout,
    openPortal,
  };
}
