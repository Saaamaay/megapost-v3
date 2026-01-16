import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "./ImageUpload";
import { PlatformSelector, type Platform } from "./PlatformSelector";
import { PostCard } from "./PostCard";

interface VoiceProfile {
  business: string;
  toneWords: string[];
  samplePost: string;
}

interface ContentGeneratorProps {
  voiceProfile: VoiceProfile;
}

// Simulated AI generation (replace with real API later)
const generatePosts = async (
  platforms: Platform[],
  description: string,
  profile: VoiceProfile
): Promise<Record<Platform, string>> => {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const posts: Record<string, string> = {};

  if (platforms.includes("linkedin")) {
    posts.linkedin = `Just wrapped up an incredible project that I'm truly proud of. 🏡

${description}

What started as a simple brief evolved into something meaningful—a space where families will make memories for generations.

As architects, we don't just design buildings; we shape experiences. Every window placement, every material choice, tells a story.

${profile.toneWords.includes("Thoughtful") ? "\nWould love to hear what projects have challenged you to think differently lately. 💭" : "\n#Architecture #Design #Sustainability"}`;
  }

  if (platforms.includes("instagram")) {
    posts.instagram = `${description} ✨

Sometimes the best designs come from the simplest ideas. This one's special to me. 

#architecture #design #modernhome${profile.toneWords.includes("Friendly") ? " #lovewhatyoudo" : ""}`;
  }

  if (platforms.includes("facebook")) {
    posts.facebook = `Excited to share our latest project! 🏠

${description}

It's been an amazing journey working with such a wonderful client. From concept to completion, every step reminded me why I love what I do.

What do you think? Would love to hear your thoughts!`;
  }

  if (platforms.includes("twitter")) {
    posts.twitter = `New project drop 🏡

${description.slice(0, 100)}${description.length > 100 ? "..." : ""}

Sometimes the best work speaks for itself.`;
  }

  return posts as Record<Platform, string>;
};

export function ContentGenerator({ voiceProfile }: ContentGeneratorProps) {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [posts, setPosts] = useState<Record<Platform, string> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const togglePlatform = (platform: Platform) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleGenerate = async () => {
    if (platforms.length === 0 || !description.trim()) return;

    setIsGenerating(true);
    setPosts(null);

    try {
      const generatedPosts = await generatePosts(platforms, description, voiceProfile);
      setPosts(generatedPosts);
    } catch (error) {
      console.error("Failed to generate posts:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = platforms.length > 0 && description.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-warm shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">PostPilot</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lightbulb className="w-4 h-4" />
            <span>Your voice: {voiceProfile.toneWords.join(", ")}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Input Section */}
          <div className="bg-card rounded-3xl border border-border shadow-card p-6 space-y-6">
            <div>
              <h2 className="font-display font-bold text-lg text-foreground mb-1">
                What would you like to share?
              </h2>
              <p className="text-muted-foreground text-sm">
                Drop an image and describe what happened—we'll craft the perfect posts.
              </p>
            </div>

            <ImageUpload image={image} onImageChange={setImage} />

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tell us about it
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Just finished this stunning modern home renovation with floor-to-ceiling windows and sustainable materials. The clients wanted a space that connected indoor and outdoor living..."
                className="w-full h-32 px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Where should we post?
              </label>
              <PlatformSelector selected={platforms} onToggle={togglePlatform} />
            </div>

            <Button
              variant="hero"
              size="xl"
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Crafting your posts...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Posts
                </>
              )}
            </Button>
          </div>

          {/* Generated Posts */}
          <AnimatePresence>
            {posts && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Your posts are ready
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {platforms.map((platform, index) => (
                    <PostCard
                      key={platform}
                      platform={platform}
                      content={posts[platform]}
                      index={index}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
