import { motion } from "framer-motion";
import { Linkedin, Instagram, Facebook, Twitter, Check, Lock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// TikTok icon (not in lucide-react)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export type Platform = "linkedin" | "instagram" | "facebook" | "twitter" | "tiktok";

interface PlatformOption {
  id: Platform;
  name: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

const platforms: PlatformOption[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: <Linkedin className="w-5 h-5" />,
    colorClass: "text-linkedin",
    bgClass: "bg-linkedin/10 border-linkedin/30",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <Instagram className="w-5 h-5" />,
    colorClass: "text-instagram",
    bgClass: "bg-instagram/10 border-instagram/30",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: <Facebook className="w-5 h-5" />,
    colorClass: "text-facebook",
    bgClass: "bg-facebook/10 border-facebook/30",
  },
  {
    id: "twitter",
    name: "X / Twitter",
    icon: <Twitter className="w-5 h-5" />,
    colorClass: "text-twitter",
    bgClass: "bg-twitter/10 border-twitter/30",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: <TikTokIcon className="w-5 h-5" />,
    colorClass: "text-tiktok",
    bgClass: "bg-tiktok/10 border-tiktok/30",
  },
];

interface PlatformSelectorProps {
  selected: Platform[];
  onToggle: (platform: Platform) => void;
  maxPlatforms?: number;
  lockedPlatform?: string | null;
  isStandardTier?: boolean;
}

export function PlatformSelector({ selected, onToggle, maxPlatforms = 5, lockedPlatform, isStandardTier }: PlatformSelectorProps) {
  const hasLockedPlatform = !!lockedPlatform;

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Warning for Standard users who haven't locked yet */}
        {isStandardTier && !hasLockedPlatform && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Standard plan:</span> The platform you select for your first post will be permanently locked to your account. To change it later, you'll need to contact support or upgrade.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {platforms.map((platform) => {
            const isSelected = selected.includes(platform.id);
            const isLockedToThis = lockedPlatform === platform.id;
            const isLockedOut = hasLockedPlatform && lockedPlatform !== platform.id && isStandardTier;
            const isLocked = !isSelected && !isLockedToThis && maxPlatforms <= selected.length && maxPlatforms < 5;
            const disabled = isLockedOut || isLocked;

            return (
              <Tooltip key={platform.id}>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={() => !disabled && onToggle(platform.id)}
                    whileHover={disabled ? {} : { scale: 1.02 }}
                    whileTap={disabled ? {} : { scale: 0.98 }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 font-medium",
                      disabled
                        ? "border-border bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
                        : isSelected
                          ? cn(platform.bgClass, platform.colorClass)
                          : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30"
                    )}
                  >
                    <span className={cn(isSelected && platform.colorClass, disabled && "opacity-40")}>
                      {disabled ? <Lock className="w-5 h-5" /> : platform.icon}
                    </span>
                    <span>{platform.name}</span>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn("ml-1", platform.colorClass)}
                      >
                        <Check className="w-4 h-4" />
                      </motion.span>
                    )}
                    {isLockedToThis && isSelected && isStandardTier && (
                      <Lock className="w-3 h-3 ml-1 opacity-50" />
                    )}
                  </motion.button>
                </TooltipTrigger>
                {disabled && (
                  <TooltipContent>
                    <p>{isLockedOut ? "Your Standard plan is locked to " + lockedPlatform + ". Upgrade or contact support to change." : "Upgrade to Premium for all platforms"}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
