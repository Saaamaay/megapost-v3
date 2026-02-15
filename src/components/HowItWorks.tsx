import { motion } from "framer-motion";
import { UserCircle, PenLine, Share2 } from "lucide-react";

const steps = [
  {
    icon: UserCircle,
    step: "1",
    title: "Set up your voice",
    description: "Tell us about your business, set your tone, and define what you stand for.",
  },
  {
    icon: PenLine,
    step: "2",
    title: "Describe your moment",
    description: "Upload a photo and tell us what happened—a project, event, or milestone.",
  },
  {
    icon: Share2,
    step: "3",
    title: "Get ready-to-post content",
    description: "Instantly receive tailored posts for every platform, written in your voice.",
  },
];

export function HowItWorks() {
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
          How it works
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          From setup to social posts in under 2 minutes.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 relative">
        {/* Connector line */}
        <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-border" />

        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            className="relative text-center"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5 relative z-10">
              <step.icon className="w-7 h-7 text-primary" />
            </div>
            <span className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
              Step {step.step}
            </span>
            <h3 className="font-display font-bold text-lg text-foreground mb-2">
              {step.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
