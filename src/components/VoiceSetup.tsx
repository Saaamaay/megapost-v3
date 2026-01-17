import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Sparkles, Building2, Palette, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceProfile {
  business: string;
  toneWords: string[];
  samplePost: string;
}

interface VoiceSetupProps {
  onComplete: (profile: VoiceProfile) => void;
  onCancel?: () => void;
  initialProfile?: VoiceProfile | null;
  isEditing?: boolean;
}

const toneOptions = [
  "Professional", "Friendly", "Witty", "Warm", 
  "Bold", "Approachable", "Inspiring", "Down-to-earth",
  "Confident", "Thoughtful", "Energetic", "Casual"
];

export function VoiceSetup({ onComplete, onCancel, initialProfile, isEditing }: VoiceSetupProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<VoiceProfile>({
    business: initialProfile?.business || "",
    toneWords: initialProfile?.toneWords || [],
    samplePost: initialProfile?.samplePost || "",
  });

  const steps = [
    {
      title: "Tell us about your business",
      subtitle: "In one sentence, what do you do?",
      icon: Building2,
    },
    {
      title: "Choose your tone",
      subtitle: "Pick 3 words that describe how you want to sound",
      icon: Palette,
    },
    {
      title: "Share an example",
      subtitle: "Paste a post you've written that felt like 'you' (optional)",
      icon: MessageSquare,
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  const toggleTone = (word: string) => {
    setProfile((prev) => ({
      ...prev,
      toneWords: prev.toneWords.includes(word)
        ? prev.toneWords.filter((w) => w !== word)
        : prev.toneWords.length < 3
        ? [...prev.toneWords, word]
        : prev.toneWords,
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return profile.business.trim().length > 0;
      case 1:
        return profile.toneWords.length >= 1;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      onComplete(profile);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-colors duration-300",
                i === step ? "bg-primary" : i < step ? "bg-primary/50" : "bg-border"
              )}
              animate={{ scale: i === step ? 1.2 : 1 }}
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-card rounded-3xl shadow-lg border border-border p-8"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-primary/10">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">
                {currentStep.title}
              </h2>
              <p className="text-muted-foreground">{currentStep.subtitle}</p>
            </div>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <textarea
                  value={profile.business}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, business: e.target.value }))
                  }
                  placeholder="e.g., I run a boutique architecture firm specializing in sustainable residential design..."
                  className="w-full h-32 px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap gap-2"
              >
                {toneOptions.map((word) => (
                  <motion.button
                    key={word}
                    onClick={() => toggleTone(word)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "px-4 py-2 rounded-xl border-2 font-medium transition-all duration-200",
                      profile.toneWords.includes(word)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground/40"
                    )}
                  >
                    {word}
                  </motion.button>
                ))}
                <p className="w-full mt-2 text-sm text-muted-foreground">
                  Selected: {profile.toneWords.length}/3
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <textarea
                  value={profile.samplePost}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, samplePost: e.target.value }))
                  }
                  placeholder="Paste a caption or post you've written before that felt authentic to your voice..."
                  className="w-full h-40 px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  This helps our AI match your unique style
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step === 0 && onCancel ? (
              <Button variant="ghost" onClick={onCancel} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                disabled={step === 0}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <Button
              variant="hero"
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2"
            >
              {step === 2 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  {isEditing ? "Save Changes" : "Start Creating"}
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
