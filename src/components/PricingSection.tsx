import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingSectionProps {
  onGetStarted: () => void;
}

const plans = [
  {
    name: "Standard",
    price: "£10",
    priceMonthlyAnnual: "£8.33",
    priceYearly: "£100",
    description: "For solo creators getting started",
    features: [
      "Unlimited post generation",
      "1 platform",
      "1 business profile",
      "Content pillars",
    ],
    highlight: false,
  },
  {
    name: "Premium",
    price: "£20",
    priceMonthlyAnnual: "£16.67",
    priceYearly: "£200",
    description: "For businesses that want it all",
    features: [
      "Unlimited post generation",
      "All 5 platforms",
      "1 business profile",
      "Content pillars",
    ],
    highlight: true,
  },
  {
    name: "Professional",
    price: "£30",
    priceMonthlyAnnual: "£25",
    priceYearly: "£300",
    description: "For agencies & multi-brand teams",
    features: [
      "Unlimited post generation",
      "All 5 platforms",
      "Up to 3 profiles",
      "Content pillars",
    ],
    highlight: false,
  },
];

export function PricingSection({ onGetStarted }: PricingSectionProps) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <section className="mt-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-6">
          Start with a 7-day free trial — full Premium access, no card required.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              billing === "monthly"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              billing === "yearly"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Annual (2 months free)
          </button>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan, index) => {
          const interval = billing === "yearly" ? "/mo" : "/mo";

          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                "relative rounded-2xl border p-6 flex flex-col",
                plan.highlight
                  ? "border-primary bg-card shadow-lg scale-[1.02]"
                  : "border-border bg-card/80"
              )}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  Most Popular
                </span>
              )}

              <h3 className="font-display font-bold text-xl text-foreground">
                {plan.name}
              </h3>
              <div className="mt-3 mb-1">
                <span className="font-display text-4xl font-extrabold text-foreground">
                  {billing === "yearly" ? plan.priceMonthlyAnnual : plan.price}
                </span>
                <span className="text-muted-foreground">/mo</span>
                {billing === "yearly" && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.priceYearly} billed annually
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {plan.description}
              </p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlight ? "hero" : "outline"}
                className="w-full"
                onClick={onGetStarted}
              >
                {plan.highlight ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Start Free Trial
                  </>
                ) : (
                  "Get Started"
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
