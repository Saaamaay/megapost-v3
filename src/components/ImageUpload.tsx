import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Image as ImageIcon, Trophy, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageRanking {
  index: number;
  rank: number;
  score: number;
  reason: string;
}

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  rankings?: ImageRanking[] | null;
  selectedIndex?: number;
  onSelectImage?: (index: number) => void;
  isAnalyzing?: boolean;
  maxImages?: number;
}

export function ImageUpload({
  images,
  onImagesChange,
  rankings,
  selectedIndex,
  onSelectImage,
  isAnalyzing,
  maxImages = 5,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
      const remaining = maxImages - images.length;
      const toProcess = fileArray.slice(0, remaining);
      if (toProcess.length === 0) return;

      // Read all files, then batch-update once
      let loaded = 0;
      const results: string[] = [];
      toProcess.forEach((file, i) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          results[i] = event.target?.result as string;
          loaded++;
          if (loaded === toProcess.length) {
            onImagesChange([...images, ...results]);
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [images, onImagesChange, maxImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const getRankingForIndex = (index: number) =>
    rankings?.find((r) => r.index === index);

  const hasImages = images.length > 0;
  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {hasImages ? (
          <motion.div
            key="images"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            {/* Image grid */}
            <div className={cn(
              "grid gap-3",
              images.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
            )}>
              {images.map((img, index) => {
                const ranking = getRankingForIndex(index);
                const isSelected = selectedIndex === index;
                const isBest = ranking?.rank === 1;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelectImage?.(index)}
                    className={cn(
                      "relative rounded-xl overflow-hidden shadow-card cursor-pointer transition-all group",
                      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                      isBest && rankings && "ring-2 ring-accent ring-offset-2 ring-offset-background"
                    )}
                  >
                    <img
                      src={img}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-40 object-cover"
                    />

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-foreground/70 backdrop-blur-sm rounded-full text-background opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {/* Ranking badge */}
                    {ranking && (
                      <div
                        className={cn(
                      "absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm",
                          isBest
                            ? "bg-accent text-accent-foreground"
                            : "bg-foreground/60 text-background"
                        )}
                      >
                        {isBest ? (
                          <Trophy className="w-3 h-3" />
                        ) : (
                          <Star className="w-3 h-3" />
                        )}
                        #{ranking.rank}
                      </div>
                    )}

                    {/* Selected indicator */}
                    {isSelected && !rankings && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        Selected
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Add more slot */}
              {canAddMore && (
                <label className={cn(
                  "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border cursor-pointer transition-all hover:border-muted-foreground/40 hover:bg-secondary/50",
                  images.length === 1 ? "h-40" : "h-40"
                )}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">
                    Add more ({images.length}/{maxImages})
                  </span>
                </label>
              )}
            </div>

            {/* Ranking explanations */}
            {rankings && rankings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-secondary/50 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Trophy className="w-4 h-4 text-accent" />
                  AI Photo Ranking
                </div>
                {rankings
                  .sort((a, b) => a.rank - b.rank)
                  .map((r) => (
                    <div
                      key={r.index}
                      onClick={() => onSelectImage?.(r.index)}
                      className={cn(
                        "flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors text-sm",
                        selectedIndex === r.index
                          ? "bg-primary/10"
                          : "hover:bg-secondary"
                      )}
                    >
                      <span
                        className={cn(
                          "font-bold min-w-[24px]",
                          r.rank === 1 ? "text-accent" : "text-muted-foreground"
                        )}
                      >
                        #{r.rank}
                      </span>
                      <p className="text-muted-foreground">{r.reason}</p>
                    </div>
                  ))}
              </motion.div>
            )}

            {/* Analyzing indicator */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-secondary/50 rounded-xl"
              >
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Analyzing your photos for social media impact...
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.label
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border bg-secondary/30 hover:border-muted-foreground/40 hover:bg-secondary/50"
            )}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <motion.div
              animate={{ y: isDragging ? -5 : 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="p-4 rounded-2xl bg-secondary">
                {isDragging ? (
                  <ImageIcon className="w-8 h-8 text-primary" />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">
                  {isDragging
                    ? "Drop your images here"
                    : "Drop images or click to upload"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Up to {maxImages} photos · PNG, JPG, GIF up to 10MB each
                </p>
              </div>
            </motion.div>
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  );
}
