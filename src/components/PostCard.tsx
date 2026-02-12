import { motion } from "framer-motion";
import { Copy, Check, Linkedin, Instagram, Facebook, Twitter, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Platform } from "./PlatformSelector";
import { Badge } from "@/components/ui/badge";
import { CroppedImagePreview } from "./CroppedImagePreview";

// TikTok icon (not in lucide-react)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export interface PostCardProps {
  platform: Platform;
  content: string;
  format?: string;
  index: number;
  onRegenerate?: (platform: Platform) => Promise<void>;
  isRegenerating?: boolean;
  imageSrc?: string;
}

const platformConfig: Record<Platform, {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}> = {
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    colorClass: "text-linkedin",
    bgClass: "bg-linkedin/10",
    borderClass: "border-linkedin/20",
  },
  instagram: {
    name: "Instagram",
    icon: Instagram,
    colorClass: "text-instagram",
    bgClass: "bg-instagram/10",
    borderClass: "border-instagram/20",
  },
  facebook: {
    name: "Facebook",
    icon: Facebook,
    colorClass: "text-facebook",
    bgClass: "bg-facebook/10",
    borderClass: "border-facebook/20",
  },
  twitter: {
    name: "X / Twitter",
    icon: Twitter,
    colorClass: "text-twitter",
    bgClass: "bg-twitter/10",
    borderClass: "border-twitter/20",
  },
  tiktok: {
    name: "TikTok",
    icon: TikTokIcon,
    colorClass: "text-tiktok",
    bgClass: "bg-tiktok/10",
    borderClass: "border-tiktok/20",
  },
};

export function PostCard({ platform, content, format, index, onRegenerate, isRegenerating, imageSrc }: PostCardProps) {
  const [copied, setCopied] = useState(false);
  const config = platformConfig[platform];
  const Icon = config.icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (onRegenerate && !isRegenerating) {
      await onRegenerate(platform);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative bg-card rounded-2xl border overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300",
        config.borderClass
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center justify-between px-5 py-4 border-b", config.borderClass, config.bgClass)}>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-card", config.colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-semibold text-foreground">{config.name}</span>
          {format && (
            <Badge variant="secondary" className="text-xs capitalize">
              {format.replace("_", " ")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <motion.button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                "bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50"
              )}
              title="Regenerate this post"
            >
              {isRegenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </motion.button>
          )}
          <motion.button
            onClick={handleCopy}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              copied
                ? "bg-green-500/20 text-green-600"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>

      {/* Cropped Image Preview */}
      {imageSrc && (
        <CroppedImagePreview
          imageSrc={imageSrc}
          platform={platform}
          format={format}
        />
      )}
    </motion.div>
  );
}
