import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomCTAProps {
  onGetStarted: () => void;
  hasProfile?: boolean;
}

export function BottomCTA({ onGetStarted, hasProfile }: BottomCTAProps) {
  return (
    <section className="mt-32 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative rounded-3xl bg-card border border-border p-10 md:p-16 text-center overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            Ready to reclaim your time?
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-8">
            Start your 7-day free trial with full Premium access. No credit card required.
          </p>
          <Button
            variant="hero"
            size="xl"
            onClick={onGetStarted}
            className="text-lg"
          >
            <Sparkles className="w-5 h-5" />
            {hasProfile ? "Start Creating" : "Get Started Free"}
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
