import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Trash2, Copy, Check, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Flame, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SavedPost {
  id: string;
  platform: string;
  content: string;
  description: string | null;
  created_at: string;
  rating: string | null;
  is_viral: boolean | null;
  linkedin_post_url: string | null;
  linkedin_shared_at: string | null;
}

const platformColors: Record<string, string> = {
  linkedin: "text-linkedin",
  instagram: "text-instagram",
  facebook: "text-facebook",
  twitter: "text-twitter",
};

const platformNames: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X / Twitter",
};

export function PostHistory() {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { user, voiceProfile } = useAuth();

  const fetchPosts = async () => {
    if (!user) return;
    
    setLoading(true);
    
    let query = supabase
      .from("generated_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    
    // Filter by current voice profile if available
    if (voiceProfile?.id) {
      query = query.eq("voice_profile_id", voiceProfile.id);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch posts:", error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
    
    // Listen for refresh events
    const handleRefresh = () => fetchPosts();
    window.addEventListener("refresh-post-history", handleRefresh);
    return () => window.removeEventListener("refresh-post-history", handleRefresh);
  }, [user, voiceProfile?.id]);

  const handleCopy = async (post: SavedPost) => {
    await navigator.clipboard.writeText(post.content);
    setCopiedId(post.id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (postId: string) => {
    const { error } = await supabase
      .from("generated_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      toast.error("Failed to delete post");
    } else {
      setPosts(posts.filter(p => p.id !== postId));
      toast.success("Post deleted");
    }
  };

  const handleRate = async (postId: string, rating: 'nailed_it' | 'not_my_voice') => {
    const post = posts.find(p => p.id === postId);
    const newRating = post?.rating === rating ? null : rating;
    
    const { error } = await supabase
      .from("generated_posts")
      .update({ rating: newRating })
      .eq("id", postId);

    if (error) {
      toast.error("Failed to update rating");
    } else {
      setPosts(posts.map(p => p.id === postId ? { ...p, rating: newRating } : p));
      if (newRating === 'nailed_it') {
        toast.success("Thanks! We'll learn from this ✨");
      } else if (newRating === 'not_my_voice') {
        toast.success("Noted! We'll adjust your voice");
      }
    }
  };

  const handleViralToggle = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    const newValue = !post?.is_viral;
    
    const { error } = await supabase
      .from("generated_posts")
      .update({ is_viral: newValue })
      .eq("id", postId);

    if (error) {
      toast.error("Failed to update");
    } else {
      setPosts(posts.map(p => p.id === postId ? { ...p, is_viral: newValue } : p));
      if (newValue) {
        toast.success("Marked as high performer! 🔥");
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!user || posts.length === 0) return null;

  return (
    <div className="bg-card rounded-3xl border border-border shadow-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-foreground">
            Recent Posts
          </span>
          <span className="text-sm text-muted-foreground">
            ({posts.length})
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4 space-y-3 max-h-96 overflow-y-auto">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-xl bg-muted/30 border group relative",
                    post.is_viral 
                      ? "border-orange-400/50 bg-orange-500/5" 
                      : "border-border/50"
                  )}
                >
                  {/* Viral badge */}
                  {post.is_viral && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Top Performer
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn("font-medium text-sm", platformColors[post.platform])}>
                          {platformNames[post.platform] || post.platform}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(post.created_at)}
                        </span>
                        {post.rating === 'nailed_it' && (
                          <span className="text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full">
                            ✓ Nailed it
                          </span>
                        )}
                        {post.rating === 'not_my_voice' && (
                          <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full">
                            Needs work
                          </span>
                        )}
                        {post.linkedin_shared_at && (
                          <a
                            href={post.linkedin_post_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-[#0A66C2]/20 text-[#0A66C2] px-2 py-0.5 rounded-full hover:bg-[#0A66C2]/30 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Posted {formatDate(post.linkedin_shared_at)}
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-2">
                        {post.content}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action buttons - always visible on mobile, hover on desktop */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                    {/* Rating buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRate(post.id, 'nailed_it')}
                        className={cn(
                          "h-8 px-3 text-xs gap-1.5",
                          post.rating === 'nailed_it' 
                            ? "bg-green-500/20 text-green-600 hover:bg-green-500/30" 
                            : "hover:bg-green-500/10 hover:text-green-600"
                        )}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        Nailed it
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRate(post.id, 'not_my_voice')}
                        className={cn(
                          "h-8 px-3 text-xs gap-1.5",
                          post.rating === 'not_my_voice' 
                            ? "bg-amber-500/20 text-amber-600 hover:bg-amber-500/30" 
                            : "hover:bg-amber-500/10 hover:text-amber-600"
                        )}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        Not my voice
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViralToggle(post.id)}
                        className={cn(
                          "h-8 px-3 text-xs gap-1.5",
                          post.is_viral 
                            ? "bg-orange-500/20 text-orange-600 hover:bg-orange-500/30" 
                            : "hover:bg-orange-500/10 hover:text-orange-600"
                        )}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        {post.is_viral ? "Top Performer" : "Mark as hit"}
                      </Button>
                    </div>
                    
                    {/* Utility buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(post)}
                        className="h-8 w-8 p-0"
                      >
                        {copiedId === post.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export function to refresh history from outside
export const refreshPostHistory = () => {
  window.dispatchEvent(new CustomEvent("refresh-post-history"));
};
