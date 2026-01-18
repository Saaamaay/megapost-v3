import { motion } from "framer-motion";
import { Wand2, AlignLeft } from "lucide-react";

interface FormatModeToggleProps {
  useFreeForm: boolean;
  onToggle: () => void;
}

export function FormatModeToggle({ useFreeForm, onToggle }: FormatModeToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Format:</span>
      <motion.button
        onClick={onToggle}
        className="relative flex items-center gap-1 rounded-full bg-muted p-1"
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
          animate={{
            backgroundColor: !useFreeForm ? "hsl(var(--primary))" : "transparent",
            color: !useFreeForm ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
          }}
        >
          <Wand2 className="w-3.5 h-3.5" />
          Smart
        </motion.div>
        <motion.div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
          animate={{
            backgroundColor: useFreeForm ? "hsl(var(--primary))" : "transparent",
            color: useFreeForm ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
          }}
        >
          <AlignLeft className="w-3.5 h-3.5" />
          Free-form
        </motion.div>
      </motion.button>
    </div>
  );
}
