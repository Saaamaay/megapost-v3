import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Palette, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceSetup } from "@/components/VoiceSetup";
import { ContentGenerator } from "@/components/ContentGenerator";

interface VoiceProfile {
  business: string;
  toneWords: string[];
  samplePost: string;
}

const Index = () => {
  const [showHero, setShowHero] = useState(true);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);

  // Show hero -> setup -> generator flow
  if (voiceProfile) {
    return <ContentGenerator voiceProfile={voiceProfile} />;
  }

  if (!showHero) {
    return <VoiceSetup onComplete={setVoiceProfile} />;
  }

  return (
    <div className="min-h-screen bg-gradient-hero overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-warm shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">PostPilot</span>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              One moment, every platform, your voice
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-tight mb-6"
          >
            Share your work,{" "}
            <span className="text-gradient">not your time</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Drop an image, pick your platforms, and get perfectly tailored posts 
            for LinkedIn, Instagram, Facebook, and X—all written in your voice.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              variant="hero"
              size="xl"
              onClick={() => setShowHero(false)}
              className="text-lg"
            >
              <Sparkles className="w-5 h-5" />
              Get Started Free
            </Button>
          </motion.div>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid md:grid-cols-3 gap-6 mt-24"
        >
          {[
            {
              icon: Zap,
              title: "Instant Generation",
              description: "From photo to polished posts in seconds, not hours.",
            },
            {
              icon: Palette,
              title: "Platform-Perfect",
              description: "Each post is tailored to match what works best on each platform.",
            },
            {
              icon: Clock,
              title: "Your Voice, Always",
              description: "AI that learns your style and writes like you—not a robot.",
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-6 hover:shadow-card transition-shadow duration-300"
            >
              <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Platform showcase */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-24 text-center"
        >
          <p className="text-sm font-medium text-muted-foreground mb-6">
            Works with all major platforms
          </p>
          <div className="flex justify-center gap-8 items-center opacity-60">
            <span className="text-linkedin font-semibold">LinkedIn</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-instagram font-semibold">Instagram</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-facebook font-semibold">Facebook</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-twitter font-semibold">X / Twitter</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
