import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Lightbulb, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUpload, type ImageRanking } from "./ImageUpload";
import { PlatformSelector, type Platform } from "./PlatformSelector";
import { PostCard } from "./PostCard";
import { PostHistory } from "./PostHistory";
import { FormatModeToggle } from "./FormatModeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useContentPillars } from "@/hooks/useContentPillars";
import { toast } from "sonner";

interface ToneScales {
  casualProfessional: number;
  funnySincere: number;
  personalFormal: number;
  groundedInspiring: number;
}

interface VoiceProfile {
  id?: string;
  profileName: string;
  business: string;
  businessLocation: string;
  employeeCount: string;
  businessType: string;
  toneScales: ToneScales;
  samplePost: string;
  brandBeliefs: string[];
}

interface ContentGeneratorProps {
  voiceProfile: VoiceProfile;
}

export function ContentGenerator({ voiceProfile }: ContentGeneratorProps) {
  const [images, setImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [imageRankings, setImageRankings] = useState<ImageRanking[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [description, setDescription] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [posts, setPosts] = useState<Record<Platform, string> | null>(null);
  const [formats, setFormats] = useState<Record<Platform, string> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingPlatform, setRegeneratingPlatform] = useState<Platform | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [useFreeForm, setUseFreeForm] = useState(false);
  const [placeholder, setPlaceholder] = useState("");
  const [lastDescription, setLastDescription] = useState("");
  const { user } = useAuth();
  const { getPlaceholder } = useContentPillars();

  // Cycle placeholder text through pillars
  useEffect(() => {
    const updatePlaceholder = () => {
      setPlaceholder(getPlaceholder(
        "e.g., Just finished this stunning modern home renovation with floor-to-ceiling windows and sustainable materials..."
      ));
    };
    
    updatePlaceholder();
    const interval = setInterval(updatePlaceholder, 10000);
    return () => clearInterval(interval);
  }, [getPlaceholder]);

  // Auto-analyze when 2+ images uploaded
  useEffect(() => {
    if (images.length >= 2 && !imageRankings && !isAnalyzing) {
      analyzeImages();
    }
    // Reset rankings when images change
    if (images.length < 2) {
      setImageRankings(null);
    }
  }, [images.length]);

  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages);
    // Reset rankings when images change
    if (newImages.length !== images.length) {
      setImageRankings(null);
    }
    // Default select first image
    if (newImages.length > 0 && selectedImageIndex >= newImages.length) {
      setSelectedImageIndex(0);
    }
  };

  const analyzeImages = async () => {
    if (images.length < 2) return;
    
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-images", {
        body: { images, platforms: platforms.length > 0 ? platforms : undefined },
      });

      if (error) {
        console.error("Analyze error:", error);
        toast.error("Couldn't analyze photos. You can still select one manually.");
        return;
      }

      if (data?.rankings) {
        setImageRankings(data.rankings);
        // Auto-select the best image
        const best = data.rankings.find((r: ImageRanking) => r.rank === 1);
        if (best) {
          setSelectedImageIndex(best.index);
        }
        toast.success("Photos ranked! Best one selected for your post.");
      }
    } catch (error) {
      console.error("Failed to analyze images:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const togglePlatform = (platform: Platform) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const savePosts = async (generatedPosts: Record<Platform, string>, desc: string) => {
    if (!user) return;

    const postsToSave = Object.entries(generatedPosts).map(([platform, content]) => ({
      user_id: user.id,
      voice_profile_id: voiceProfile.id || null,
      platform,
      content,
      description: desc,
    }));

    const { error } = await supabase.from("generated_posts").insert(postsToSave);

    if (error) {
      console.error("Failed to save posts:", error);
    } else {
      setHistoryKey(prev => prev + 1);
    }
  };

  const saveSinglePost = async (platform: Platform, content: string, desc: string) => {
    if (!user) return;

    const { error } = await supabase.from("generated_posts").insert({
      user_id: user.id,
      voice_profile_id: voiceProfile.id || null,
      platform,
      content,
      description: desc,
    });

    if (error) {
      console.error("Failed to save post:", error);
    } else {
      setHistoryKey(prev => prev + 1);
    }
  };

  const getSelectedImage = () => {
    if (images.length === 0) return undefined;
    return images[selectedImageIndex] || images[0];
  };

  const handleGenerate = async () => {
    if (platforms.length === 0 || !description.trim()) return;

    setIsGenerating(true);
    setPosts(null);
    setLastDescription(description);

    try {
      const { data, error } = await supabase.functions.invoke("generate-posts", {
        body: {
          platforms,
          description,
          voiceProfile,
          voiceProfileId: voiceProfile.id,
          imageBase64: getSelectedImage(),
          useSmartFormats: !useFreeForm,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        toast.error("Failed to generate posts. Please try again.");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.posts) {
        const generatedPosts = data.posts as Record<Platform, string>;
        setPosts(generatedPosts);
        
        if (data?.formats) {
          setFormats(data.formats as Record<Platform, string>);
        }
        
        toast.success("Posts generated successfully!");
        await savePosts(generatedPosts, description);
      }
    } catch (error) {
      console.error("Failed to generate posts:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (platform: Platform) => {
    if (!lastDescription.trim()) return;

    setRegeneratingPlatform(platform);

    try {
      const { data, error } = await supabase.functions.invoke("generate-posts", {
        body: {
          platforms: [platform],
          description: lastDescription,
          voiceProfile,
          voiceProfileId: voiceProfile.id,
          imageBase64: getSelectedImage(),
          useSmartFormats: !useFreeForm,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        toast.error("Failed to regenerate post. Please try again.");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.posts && data.posts[platform]) {
        const newContent = data.posts[platform] as string;
        setPosts(prev => prev ? { ...prev, [platform]: newContent } : null);
        
        if (data?.formats && data.formats[platform]) {
          setFormats(prev => prev ? { ...prev, [platform]: data.formats[platform] } : null);
        }
        
        toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} post regenerated!`);
        await saveSinglePost(platform, newContent, lastDescription);
      }
    } catch (error) {
      console.error("Failed to regenerate post:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setRegeneratingPlatform(null);
    }
  };

  const canGenerate = platforms.length > 0 && description.trim().length > 0;

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Voice indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="w-4 h-4" />
          <span>Writing in your voice: <span className="text-foreground font-medium">
            {voiceProfile.toneScales.casualProfessional <= 2 ? "Casual" : voiceProfile.toneScales.casualProfessional >= 4 ? "Professional" : "Balanced"}, {voiceProfile.businessType || "Business"}
          </span></span>
        </div>

        {/* Input Section */}
        <div className="bg-card rounded-3xl border border-border shadow-card p-6 space-y-6">
          <div>
            <h2 className="font-display font-bold text-lg text-foreground mb-1">
              What would you like to share?
            </h2>
            <p className="text-muted-foreground text-sm">
              Drop your photos and describe what happened—we'll pick the best shot and craft the perfect posts.
            </p>
          </div>

          <ImageUpload
            images={images}
            onImagesChange={handleImagesChange}
            rankings={imageRankings}
            selectedIndex={selectedImageIndex}
            onSelectImage={setSelectedImageIndex}
            isAnalyzing={isAnalyzing}
          />

          {/* Re-analyze button if images changed */}
          {images.length >= 2 && imageRankings && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={analyzeImages}
                disabled={isAnalyzing}
                className="text-xs"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <ImageIcon className="w-3 h-3 mr-1" />
                )}
                Re-analyze photos
              </Button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tell us about it
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={placeholder}
              className="w-full h-32 px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Where should we post?
              </label>
              <PlatformSelector selected={platforms} onToggle={togglePlatform} />
            </div>
            
            {platforms.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div className="text-sm text-muted-foreground">
                  {useFreeForm 
                    ? "Free-form: Standard post format" 
                    : "Smart: AI picks the best format (thread, carousel, etc.) for each platform"
                  }
                </div>
                <FormatModeToggle 
                  useFreeForm={useFreeForm} 
                  onToggle={() => setUseFreeForm(!useFreeForm)} 
                />
              </div>
            )}
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
                    format={formats?.[platform]}
                    index={index}
                    onRegenerate={handleRegenerate}
                    isRegenerating={regeneratingPlatform === platform}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post History */}
        <PostHistory key={historyKey} />
      </motion.div>
    </main>
  );
}
