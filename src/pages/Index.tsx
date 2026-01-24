import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Zap, Palette, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceSetup } from "@/components/VoiceSetup";
import { ContentGenerator } from "@/components/ContentGenerator";
import { ContentPillars } from "@/components/ContentPillars";
import { NavBar } from "@/components/NavBar";
import { useAuth } from "@/hooks/useAuth";
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
}

type ViewState = "hero" | "setup" | "generator" | "edit" | "pillars" | "newBusiness";

const Index = () => {
  const [viewState, setViewState] = useState<ViewState>("hero");
  const [localVoiceProfile, setLocalVoiceProfile] = useState<VoiceProfile | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const { user, loading, voiceProfile, signOut, saveVoiceProfile } = useAuth();
  const navigate = useNavigate();

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

  const handleAddNewBusiness = () => {
    setEditingProfileId(null);
    setViewState("newBusiness");
  };

  const handleNavigate = (view: "hero" | "generator" | "edit" | "pillars") => {
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
          initialProfile={activeProfile}
          isEditing
        />
      </div>
    );
  }

  // Show content pillars (ideas) for logged-in users
  if (viewState === "pillars" && activeProfile) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <NavBar onNavigate={handleNavigate} currentView="pillars" onAddNewBusiness={handleAddNewBusiness} />
        <ContentPillars onStartCreating={() => setViewState("generator")} />
      </div>
    );
  }

  // Show content generator if we have a profile
  if (viewState === "generator" && activeProfile) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <NavBar onNavigate={handleNavigate} currentView="generator" onAddNewBusiness={handleAddNewBusiness} />
        <ContentGenerator voiceProfile={activeProfile} />
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
              onClick={handleGetStarted}
              className="text-lg"
            >
              <Sparkles className="w-5 h-5" />
              {user && voiceProfile ? "Start Creating" : "Get Started Free"}
            </Button>
          </motion.div>

          {user && voiceProfile && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 text-sm text-muted-foreground"
            >
              <User className="w-4 h-4 inline mr-1" />
              Your voice profile is ready
            </motion.p>
          )}
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
