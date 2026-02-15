import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Sparkles, Building2, Palette, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ToneSlider } from "./ToneSlider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface VoiceProfile {
  profileName: string;
  business: string;
  businessLocation: string;
  employeeCount: string;
  businessType: string;
  toneScales: {
    casualProfessional: number;
    funnySincere: number;
    personalFormal: number;
    groundedInspiring: number;
  };
  samplePost: string;
  brandBeliefs: string[];
}

interface VoiceSetupProps {
  onComplete: (profile: VoiceProfile) => void;
  onCancel?: () => void;
  onDelete?: () => Promise<void>;
  initialProfile?: VoiceProfile | null;
  isEditing?: boolean;
  isNewBusiness?: boolean;
  canDelete?: boolean;
}

const employeeOptions = ["Just me", "2-10", "11-50", "51-200", "200+"];
const businessTypes = [
  "Professional Services",
  "Retail & E-commerce",
  "Food & Hospitality",
  "Tech & SaaS",
  "Health & Wellness",
  "Education",
  "Art & Entertainment",
  "Other"
];

export function VoiceSetup({ onComplete, onCancel, onDelete, initialProfile, isEditing, isNewBusiness, canDelete }: VoiceSetupProps) {
  const [step, setStep] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };
  const [profile, setProfile] = useState<VoiceProfile>({
    profileName: initialProfile?.profileName || "",
    business: initialProfile?.business || "",
    businessLocation: initialProfile?.businessLocation || "",
    employeeCount: initialProfile?.employeeCount || "",
    businessType: initialProfile?.businessType || "",
    toneScales: initialProfile?.toneScales || {
      casualProfessional: 3,
      funnySincere: 3,
      personalFormal: 3,
      groundedInspiring: 3,
    },
    samplePost: initialProfile?.samplePost || "",
    brandBeliefs: initialProfile?.brandBeliefs || ["", "", ""],
  });

  const steps = [
    {
      title: "Tell us about your business",
      subtitle: "Help us understand who you are",
      icon: Building2,
    },
    {
      title: "Set your tone",
      subtitle: "Dial in how you want to sound",
      icon: Palette,
    },
    {
      title: "Define your beliefs",
      subtitle: "What does your brand stand for?",
      icon: MessageSquare,
    },
  ];

  // Belief prompt starters based on business type
  const beliefStarters = [
    "We believe that...",
    "We stand for...",
    "We believe in...",
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  const canProceed = () => {
    switch (step) {
      case 0:
        return profile.profileName.trim().length > 0 && profile.business.trim().length > 0;
      case 1:
        return true;
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
    <div className="flex items-center justify-center p-6 min-h-[calc(100vh-60px)]">
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
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Profile name <span className="text-muted-foreground">(for switching between businesses)</span>
                  </label>
                  <input
                    type="text"
                    value={profile.profileName}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, profileName: e.target.value }))
                    }
                    placeholder="e.g., My Architecture Firm"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Describe your business in one sentence
                  </label>
                  <textarea
                    value={profile.business}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, business: e.target.value }))
                    }
                    placeholder="e.g., I run a boutique architecture firm specializing in sustainable residential design..."
                    className="w-full h-24 px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Where is your business located?
                  </label>
                  <input
                    type="text"
                    value={profile.businessLocation}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, businessLocation: e.target.value }))
                    }
                    placeholder="e.g., London, UK"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    How many employees?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {employeeOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setProfile((prev) => ({ ...prev, employeeCount: option }))
                        }
                        className={cn(
                          "px-4 py-2 rounded-xl border-2 font-medium transition-all duration-200",
                          profile.employeeCount === option
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-muted-foreground/40"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    What type of business?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {businessTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setProfile((prev) => ({ ...prev, businessType: type }))
                        }
                        className={cn(
                          "px-4 py-2 rounded-xl border-2 font-medium transition-all duration-200 text-sm",
                          profile.businessType === type
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-muted-foreground/40"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <ToneSlider
                  leftLabel="Casual"
                  rightLabel="Professional"
                  value={profile.toneScales.casualProfessional}
                  onChange={(value) =>
                    setProfile((prev) => ({
                      ...prev,
                      toneScales: { ...prev.toneScales, casualProfessional: value },
                    }))
                  }
                />
                <ToneSlider
                  leftLabel="Funny"
                  rightLabel="Sincere"
                  value={profile.toneScales.funnySincere}
                  onChange={(value) =>
                    setProfile((prev) => ({
                      ...prev,
                      toneScales: { ...prev.toneScales, funnySincere: value },
                    }))
                  }
                />
                <ToneSlider
                  leftLabel="Personal"
                  rightLabel="Formal"
                  value={profile.toneScales.personalFormal}
                  onChange={(value) =>
                    setProfile((prev) => ({
                      ...prev,
                      toneScales: { ...prev.toneScales, personalFormal: value },
                    }))
                  }
                />
                <ToneSlider
                  leftLabel="Down to earth"
                  rightLabel="Inspiring"
                  value={profile.toneScales.groundedInspiring}
                  onChange={(value) =>
                    setProfile((prev) => ({
                      ...prev,
                      toneScales: { ...prev.toneScales, groundedInspiring: value },
                    }))
                  }
                />
                <p className="text-sm text-muted-foreground text-center">
                  1 = fully left, 5 = fully right, 3 = balanced
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground mb-4">
                  "We believe..." statements capture what makes your brand different. These will help make your posts more distinctive and opinionated.
                </p>
                
                {[0, 1, 2].map((index) => (
                  <div key={index} className="space-y-1">
                    <label className="block text-sm font-medium text-foreground">
                      {beliefStarters[index]}
                    </label>
                    <input
                      type="text"
                      value={profile.brandBeliefs[index] || ""}
                      onChange={(e) => {
                        const newBeliefs = [...profile.brandBeliefs];
                        newBeliefs[index] = e.target.value;
                        setProfile((prev) => ({ ...prev, brandBeliefs: newBeliefs }));
                      }}
                      placeholder={
                        index === 0 ? "e.g., great design should be accessible to everyone"
                        : index === 1 ? "e.g., sustainability isn't a trend—it's the future"
                        : "e.g., taking risks and learning from mistakes"
                      }
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                ))}
                
                <p className="text-xs text-muted-foreground/70 mt-2">
                  These are optional — you can always add them later.
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  💡 Tip: Good beliefs are opinionated—they might even turn some people off, and that's okay!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <div className="flex gap-2">
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
              
              {isEditing && canDelete && step === 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this business profile?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the "{initialProfile?.profileName}" profile and all associated settings.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? "Deleting..." : "Delete Profile"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <Button
              variant="hero"
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2"
            >
              {step === 2 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  {isEditing ? "Save Changes" : isNewBusiness ? "Add Business" : "Start Creating"}
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
