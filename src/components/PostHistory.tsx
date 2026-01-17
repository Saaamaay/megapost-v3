import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Trash2, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
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
  const { user } = useAuth();

  const fetchPosts = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("generated_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Failed to fetch posts:", error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

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
            <div className="px-6 pb-4 space-y-3 max-h-80 overflow-y-auto">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-muted/30 border border-border/50 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn("font-medium text-sm", platformColors[post.platform])}>
                          {platformNames[post.platform] || post.platform}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-2">
                        {post.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
