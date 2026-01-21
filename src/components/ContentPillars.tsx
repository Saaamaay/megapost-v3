import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ContentPillar {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

interface ContentPillarsProps {
  onStartCreating: () => void;
}

export const ContentPillars = ({ onStartCreating }: ContentPillarsProps) => {
  const { user, voiceProfile } = useAuth();
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Fetch existing pillars
  useEffect(() => {
    const fetchPillars = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("content_pillars")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching pillars:", error);
      } else {
        setPillars(data || []);
      }
      setLoading(false);
    };

    fetchPillars();
  }, [user]);

  // Generate initial pillars if none exist
  useEffect(() => {
    if (!loading && pillars.length === 0 && voiceProfile && !generating) {
      generatePillars(true);
    }
  }, [loading, pillars.length, voiceProfile]);

  const generatePillars = async (isInitial = false) => {
    if (!voiceProfile || !user) return;
    
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pillars", {
        body: {
          businessType: voiceProfile.businessType,
          businessDescription: voiceProfile.business,
          existingPillars: pillars.map(p => p.title),
        },
      });

      if (error) throw error;

      const newPillars = data.pillars || [];
      
      // Save new pillars to database
      for (const pillar of newPillars) {
        const { data: inserted, error: insertError } = await supabase
          .from("content_pillars")
          .insert({
            user_id: user.id,
            title: pillar.title,
            description: pillar.description,
            emoji: pillar.emoji || "💡",
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error saving pillar:", insertError);
        } else if (inserted) {
          setPillars(prev => [...prev, inserted]);
        }
      }

      if (!isInitial) {
        toast.success(`Added ${newPillars.length} new content ideas!`);
      }
    } catch (error) {
      console.error("Error generating pillars:", error);
      toast.error("Failed to generate content ideas");
    } finally {
      setGenerating(false);
    }
  };

  const deletePillar = async (id: string) => {
    const { error } = await supabase
      .from("content_pillars")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete idea");
    } else {
      setPillars(prev => prev.filter(p => p.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
          Content ideas for your{" "}
          <span className="text-primary">{voiceProfile?.businessType || "business"}</span>
        </h1>
        <p className="text-muted-foreground">
          Themes that work well for your social media
        </p>
      </motion.div>

      <div className="space-y-3 mb-8">
        <AnimatePresence mode="popLayout">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              className="group relative bg-card border border-border rounded-xl p-4 hover:shadow-card transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl">{pillar.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{pillar.title}</h3>
                  <p className="text-sm text-muted-foreground">{pillar.description}</p>
                </div>
                <button
                  onClick={() => deletePillar(pillar.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-all"
                  aria-label="Delete idea"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 py-4 text-muted-foreground"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating ideas...</span>
          </motion.div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="outline"
          onClick={() => generatePillars(false)}
          disabled={generating}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Get another idea
        </Button>

        <Button
          variant="hero"
          size="lg"
          onClick={onStartCreating}
          className="gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Start Creating
        </Button>
      </div>
    </div>
  );
};
