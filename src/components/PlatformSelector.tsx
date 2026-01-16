import { motion } from "framer-motion";
import { Linkedin, Instagram, Facebook, Twitter, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Platform = "linkedin" | "instagram" | "facebook" | "twitter";

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
