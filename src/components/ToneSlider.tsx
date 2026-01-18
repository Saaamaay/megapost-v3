import { cn } from "@/lib/utils";

interface ToneSliderProps {
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (value: number) => void;
}

export function ToneSlider({ leftLabel, rightLabel, value, onChange }: ToneSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-medium text-muted-foreground">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={cn(
              "flex-1 h-10 rounded-lg border-2 font-medium transition-all duration-200",
              value === level
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-muted-foreground/40"
            )}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
}
