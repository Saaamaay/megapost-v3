import { useState } from "react";
import { Check, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PLANS, type SubscriptionTier } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TIER_FEATURES: Record<string, { features: string[]; highlight?: boolean }> = {
  standard: {
    features: ["Unlimited post generation", "1 platform", "1 business profile", "Content pillars"],
  },
  premium: {
    features: ["Unlimited post generation", "All 5 platforms", "1 business profile", "Content pillars"],
    highlight: true,
  },
  professional: {
    features: ["Unlimited post generation", "All 5 platforms", "Up to 3 profiles", "Content pillars"],
  },
};

interface PlanPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPlan: (priceId: string) => Promise<void>;
}

export function PlanPickerDialog({ open, onOpenChange, onSelectPlan }: PlanPickerDialogProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (planKey: string, priceId: string) => {
    setLoading(planKey);
    try {
      await onSelectPlan(priceId);
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center">Choose your plan</DialogTitle>
          <p className="text-sm text-muted-foreground text-center">Pick the plan that fits your needs. Cancel anytime.</p>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3 mt-4">
          {(Object.entries(PLANS) as [Exclude<SubscriptionTier, "free">, typeof PLANS[keyof typeof PLANS]][]).map(([planKey, plan]) => {
            const tierInfo = TIER_FEATURES[planKey];
            const isHighlighted = tierInfo?.highlight;

            return (
              <div
                key={planKey}
                className={cn(
                  "relative rounded-xl border p-5 space-y-4 transition-all",
                  isHighlighted ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border bg-card"
                )}
              >
                {isHighlighted && (
                  <span className="absolute -top-3 left-4 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 className="font-display font-bold text-foreground">{plan.name}</h3>
                  <p className="font-display font-bold text-2xl text-foreground mt-1">
                    {plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                </div>

                <ul className="space-y-2 text-sm">
                  {tierInfo?.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isHighlighted ? "default" : "outline"}
                  size="sm"
                  className="w-full gap-2"
                  disabled={loading !== null}
                  onClick={() => handleSelect(planKey, plan.price_id)}
                >
                  {loading === planKey ? "Loading…" : (
                    <>
                      <Crown className="w-4 h-4" />
                      Choose {plan.name}
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
