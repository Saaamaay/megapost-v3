import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  image: string | null;
  onImageChange: (image: string | null) => void;
}

export function ImageUpload({ image, onImageChange }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          onImageChange(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onImageChange]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageChange(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {image ? (
          <motion.div
            key="image"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-2xl overflow-hidden shadow-card"
          >
            <img
              src={image}
              alt="Uploaded content"
              className="w-full h-64 object-cover"
            />
            <button
              onClick={() => onImageChange(null)}
              className="absolute top-3 right-3 p-2 bg-foreground/80 backdrop-blur-sm rounded-full text-background hover:bg-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
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
                  {isDragging ? "Drop your image here" : "Drop an image or click to upload"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </motion.div>
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  );
}
