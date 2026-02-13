import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const PLANS = {
  pro: {
    price_id: "price_1T07zqCYzAdXKBHty3g6o67K",
    product_id: "prod_Ty48vtBStymfFT",
    name: "Pro Plan",
    price: "£20",
    interval: "month",
  },
} as const;

interface SubscriptionData {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

async function fetchSubscription(): Promise<SubscriptionData> {
  const { data, error } = await supabase.functions.invoke("check-subscription");
  // Treat auth errors as "not subscribed" instead of throwing
  if (error) {
    const msg = typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error);
    if (msg.includes("Unauthorized") || msg.includes("Auth session missing") || msg.includes("401")) {
      return { subscribed: false, product_id: null, subscription_end: null };
    }
    throw error;
  }
  return {
    subscribed: data.subscribed ?? false,
    product_id: data.product_id ?? null,
    subscription_end: data.subscription_end ?? null,
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

  const checkSubscription = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
  }, [queryClient]);

  const startCheckout = async (priceId: string = PLANS.pro.price_id) => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId },
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
    isPro: subscribed && productId === PLANS.pro.product_id,
    checkSubscription,
    startCheckout,
    openPortal,
  };
}
