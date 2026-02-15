import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Zap, Palette, Clock, ThumbsUp, ThumbsDown, Flame } from "lucide-react";
import { HowItWorks } from "@/components/HowItWorks";
import { PricingSection } from "@/components/PricingSection";
import { FAQ } from "@/components/FAQ";
import { BottomCTA } from "@/components/BottomCTA";
import { Button } from "@/components/ui/button";
import { VoiceSetup } from "@/components/VoiceSetup";
import { ContentGenerator } from "@/components/ContentGenerator";
import { ContentPillars } from "@/components/ContentPillars";
import { AccountSettings } from "@/components/AccountSettings";
import { NavBar } from "@/components/NavBar";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";

interface ToneScales {
  casualProfessional: number;
  funnySincere: number;
  personalFormal: number;
  groundedInspiring: number;
}

interface VoiceProfile {
  profileName: string;
  business: string;
  businessLocation: string;
  employeeCount: string;
  businessType: string;
  toneScales: ToneScales;
  samplePost: string;
  brandBeliefs: string[];
  lockedPlatform?: string | null;
}

type ViewState = "hero" | "setup" | "generator" | "edit" | "pillars" | "newBusiness" | "account";

const Index = () => {
  const [viewState, setViewState] = useState<ViewState>("hero");
  const [localVoiceProfile, setLocalVoiceProfile] = useState<VoiceProfile | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const { user, loading, voiceProfile, allProfiles, signOut, saveVoiceProfile, deleteProfile } = useAuth();
  const { checkSubscription } = useSubscription();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle return from Stripe checkout
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      checkSubscription();
      toast.success("Welcome! Your subscription is now active.");
      setSearchParams({}, { replace: true });
    } else if (checkout === "cancelled") {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, checkSubscription, setSearchParams]);

  // Use saved profile if available
  const activeProfile = voiceProfile || localVoiceProfile;

  const handleVoiceSetupComplete = async (profile: VoiceProfile, isEdit = false) => {
    if (user) {
      // When editing, pass the profile ID; when creating new, don't pass ID
      const profileId = isEdit && voiceProfile ? voiceProfile.id : undefined;
      const { error } = await saveVoiceProfile(profile, profileId);
      if (error) {
        toast.error("Failed to save voice profile");
      } else {
        toast.success(isEdit ? "Voice profile updated!" : "Voice profile saved!");
      }
    }
    setLocalVoiceProfile(profile);
    setEditingProfileId(null);
    setViewState("generator");
  };

  const handleDeleteProfile = async () => {
    if (!voiceProfile) return;
    const { error } = await deleteProfile(voiceProfile.id);
    if (error) {
      toast.error(error.message || "Failed to delete profile");
    } else {
      toast.success("Business profile deleted");
      setViewState("generator");
    }
  };

  const handleAddNewBusiness = () => {
    setEditingProfileId(null);
    setViewState("newBusiness");
  };

  const handleNavigate = (view: "hero" | "generator" | "edit" | "pillars" | "account") => {
    if ((view === "generator" || view === "pillars") && !activeProfile) {
      setViewState("setup");
    } else {
      setViewState(view);
    }
  };

  const handleGetStarted = () => {
    if (user && voiceProfile) {
      // Go to pillars (ideas) page for logged-in users with profile
      setViewState("pillars");
    } else if (user) {
      setViewState("setup");
    } else {
      navigate("/auth");
    }
  };

  // Account settings view
  if (viewState === "account" && user) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <NavBar onNavigate={handleNavigate} currentView="account" onAddNewBusiness={handleAddNewBusiness} />
        <AccountSettings />
      </div>
    );
  }

  // New business setup view
  if (viewState === "newBusiness") {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <NavBar onNavigate={handleNavigate} currentView="setup" />
        <VoiceSetup
          onComplete={(profile) => handleVoiceSetupComplete(profile, false)}
          onCancel={() => setViewState("generator")}
          isNewBusiness
        />
      </div>
    );
  }

  // Edit profile view
  if (viewState === "edit" && activeProfile) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <NavBar onNavigate={handleNavigate} currentView="edit" onAddNewBusiness={handleAddNewBusiness} />
        <VoiceSetup
          onComplete={(profile) => handleVoiceSetupComplete(profile, true)}
          onCancel={() => setViewState("generator")}
          onDelete={handleDeleteProfile}
          initialProfile={activeProfile}
          isEditing
          canDelete={allProfiles.length > 1}
        />
      </div>
    );
  }

  // Show content pillars (ideas) for logged-in users
  if (viewState === "pillars" && activeProfile) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <NavBar onNavigate={handleNavigate} currentView="pillars" onAddNewBusiness={handleAddNewBusiness} />
        <ContentPillars key={voiceProfile?.id} onStartCreating={() => setViewState("generator")} />
      </div>
    );
  }

  // Show content generator if we have a profile
  if (viewState === "generator" && activeProfile) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <NavBar onNavigate={handleNavigate} currentView="generator" onAddNewBusiness={handleAddNewBusiness} />
        <ContentGenerator key={voiceProfile?.id} voiceProfile={activeProfile} />
      </div>
    );
  }

  // Show voice setup if user clicked get started
  if (viewState === "setup") {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <NavBar onNavigate={handleNavigate} currentView="setup" />
        <VoiceSetup onComplete={handleVoiceSetupComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero overflow-hidden">
      <NavBar onNavigate={handleNavigate} currentView="hero" onAddNewBusiness={handleAddNewBusiness} />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

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
            Pick your platforms, and get perfectly tailored posts for LinkedIn, Instagram, Facebook, and X—all written in your voice.
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
              onClick={handleGetStarted}
              className="text-lg"
            >
              <Sparkles className="w-5 h-5" />
              {user && voiceProfile ? "Start Creating" : "Get Started Free"}
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

        {/* How it works — shown to everyone */}
        <HowItWorks />

        {/* Smart Feedback Loop highlight */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-24"
        >
          <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl border border-border p-8 md:p-12 overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
              >
                <Sparkles className="w-4 h-4" />
                Teach the AI your voice
              </motion.div>

              <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-4">
                Smart Feedback Loop
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Rate every post so the AI learns what sounds like you—and what doesn't.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                {[
                  { icon: ThumbsUp, label: "Nailed it", color: "text-green-500", bg: "bg-green-500/10 border-green-500/20" },
                  { icon: ThumbsDown, label: "Not my voice", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
                  { icon: Flame, label: "Mark as hit", color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border ${item.bg} hover-scale cursor-default`}
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="font-medium text-foreground text-sm">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Visitor-only sections */}
        {!user && (
          <>
            <PricingSection onGetStarted={handleGetStarted} />

            {/* Platform showcase */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="mt-24 text-center"
            >
              <p className="text-sm font-medium text-muted-foreground mb-6">
                Works with all major platforms
              </p>
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 items-center opacity-60">
                <span className="text-linkedin font-semibold">LinkedIn</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-instagram font-semibold">Instagram</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-facebook font-semibold">Facebook</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-twitter font-semibold">X / Twitter</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-foreground font-semibold">TikTok</span>
              </div>
            </motion.div>

            <FAQ />
            <BottomCTA onGetStarted={handleGetStarted} hasProfile={false} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
