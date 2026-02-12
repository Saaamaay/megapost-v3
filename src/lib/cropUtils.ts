// Platform + format → recommended aspect ratio
const platformFormatRatios: Record<string, Record<string, number>> = {
  linkedin: {
    carousel: 1,          // 1:1 square slides
    story_post: 1.91,     // 1.91:1 landscape
    insight: 1.91,
    standard: 1.91,       // landscape for feed
  },
  instagram: {
    carousel: 1,          // 1:1 square slides
    reel_script: 9 / 16,  // 9:16 portrait
    caption: 4 / 5,       // 4:5 portrait (optimal feed)
    standard: 1,          // square
  },
  twitter: {
    thread: 16 / 9,
    hook_tweet: 16 / 9,
    standard: 16 / 9,
  },
  facebook: {
    story_post: 1.91,
    question_post: 1.91,
    standard: 1.91,
  },
  tiktok: {
    hook_script: 9 / 16,
    trend_take: 9 / 16,
    story_time: 9 / 16,
    standard: 9 / 16,
  },
};

const platformDefaultRatios: Record<string, number> = {
  linkedin: 1.91,
  instagram: 1,
  twitter: 16 / 9,
  facebook: 1.91,
  tiktok: 9 / 16,
};

export interface CropRatio {
  width: number;
  height: number;
  label: string;
}

export function getRecommendedRatio(platform: string, format?: string): CropRatio {
  const ratio = (format && platformFormatRatios[platform]?.[format]) ?? platformDefaultRatios[platform] ?? 1;

  // Express as simple w:h for display
  if (ratio === 1) return { width: 1, height: 1, label: "1:1" };
  if (ratio === 4 / 5) return { width: 4, height: 5, label: "4:5" };
  if (ratio === 9 / 16) return { width: 9, height: 16, label: "9:16" };
  if (ratio === 16 / 9) return { width: 16, height: 9, label: "16:9" };
  if (ratio >= 1.9) return { width: 1.91, height: 1, label: "1.91:1" };

  return { width: ratio, height: 1, label: `${ratio.toFixed(2)}:1` };
}

/**
 * Crop an image (base64/url) to a target aspect ratio (center-crop).
 * Returns a base64 data URL of the cropped image.
 */
export function cropImageToRatio(
  imageSrc: string,
  targetRatio: CropRatio,
  maxWidth = 1200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const aspectRatio = targetRatio.width / targetRatio.height;

      let srcW = img.naturalWidth;
      let srcH = img.naturalHeight;
      let sx = 0;
      let sy = 0;

      const currentRatio = srcW / srcH;

      if (currentRatio > aspectRatio) {
        // Image is wider → crop sides
        srcW = Math.round(srcH * aspectRatio);
        sx = Math.round((img.naturalWidth - srcW) / 2);
      } else {
        // Image is taller → crop top/bottom
        srcH = Math.round(srcW / aspectRatio);
        sy = Math.round((img.naturalHeight - srcH) / 2);
      }

      // Output size
      const outW = Math.min(srcW, maxWidth);
      const outH = Math.round(outW / aspectRatio);

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, outW, outH);

      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

/**
 * Trigger a download of a base64 data URL.
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
