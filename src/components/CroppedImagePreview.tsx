import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { cropImageToRatio, downloadDataUrl, getRecommendedRatio } from "@/lib/cropUtils";
import type { Platform } from "./PlatformSelector";
import { Badge } from "@/components/ui/badge";

interface CroppedImagePreviewProps {
  imageSrc: string;
  platform: Platform;
  format?: string;
}

export function CroppedImagePreview({ imageSrc, platform, format }: CroppedImagePreviewProps) {
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const ratio = getRecommendedRatio(platform, format);

  useEffect(() => {
    let cancelled = false;
    setIsCropping(true);
    setCroppedUrl(null);

    cropImageToRatio(imageSrc, ratio)
      .then((url) => {
        if (!cancelled) setCroppedUrl(url);
      })
      .catch(() => {
        // Fall back to original
        if (!cancelled) setCroppedUrl(imageSrc);
      })
      .finally(() => {
        if (!cancelled) setIsCropping(false);
      });

    return () => { cancelled = true; };
  }, [imageSrc, ratio.width, ratio.height]);

  const handleDownload = async () => {
    if (!croppedUrl) return;
    setIsDownloading(true);
    try {
      const filename = `${platform}${format ? `-${format}` : ""}-${ratio.label.replace(":", "x")}.jpg`;
      downloadDataUrl(croppedUrl, filename);
    } finally {
      setIsDownloading(false);
    }
  };

  // Compute a reasonable max-height for the preview container
  const isPortrait = ratio.height > ratio.width;
  const maxH = isPortrait ? "max-h-64" : "max-h-48";

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="border-t border-border"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Maximize2 className="w-3 h-3" />
            <span>Recommended crop</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {ratio.label}
            </Badge>
          </div>
          <motion.button
            onClick={handleDownload}
            disabled={!croppedUrl || isDownloading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              "bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
            )}
          >
            {isDownloading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            Download
          </motion.button>
        </div>

        <div className={cn("relative rounded-lg overflow-hidden bg-muted flex items-center justify-center", maxH)}>
          {isCropping ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cropping...
            </div>
          ) : croppedUrl ? (
            <img
              src={croppedUrl}
              alt={`${platform} cropped preview`}
              className="w-full h-full object-contain"
            />
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
