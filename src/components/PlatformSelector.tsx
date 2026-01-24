import { motion } from "framer-motion";
import { Linkedin, Instagram, Facebook, Twitter, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export function PlatformSelector({ selected, onToggle }: PlatformSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {platforms.map((platform) => {
        const isSelected = selected.includes(platform.id);
        return (
          <motion.button
            key={platform.id}
            onClick={() => onToggle(platform.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 font-medium",
              isSelected
                ? cn(platform.bgClass, platform.colorClass)
                : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30"
            )}
          >
            <span className={cn(isSelected && platform.colorClass)}>
              {platform.icon}
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
          </motion.button>
        );
      })}
    </div>
  );
}
