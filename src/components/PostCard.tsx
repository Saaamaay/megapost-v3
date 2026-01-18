import { motion } from "framer-motion";
import { Copy, Check, Linkedin, Instagram, Facebook, Twitter } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Platform } from "./PlatformSelector";
import { Badge } from "@/components/ui/badge";

export interface PostCardProps {
  platform: Platform;
  content: string;
  format?: string;
  index: number;
}

const platformConfig = {
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
};

export function PostCard({ platform, content, format, index }: PostCardProps) {
  const [copied, setCopied] = useState(false);
  const config = platformConfig[platform];
  const Icon = config.icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      {/* Content */}
      <div className="p-5">
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </motion.div>
  );
}
