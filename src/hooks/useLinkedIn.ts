import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const LINKEDIN_SCOPES = "openid profile w_member_social";
const REDIRECT_PATH = "/";
const STATE_KEY = "linkedin_oauth_state";

interface LinkedInConnection {
  id: string;
  linkedin_name: string | null;
  linkedin_person_id: string;
}

async function fetchLinkedInConnection(): Promise<LinkedInConnection | null> {
  const { data, error } = await supabase
    .from("linkedin_connections")
    .select("id, linkedin_name, linkedin_person_id")
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch LinkedIn connection:", error);
    return null;
  }
  return data;
}

export function useLinkedIn() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: connection, isLoading } = useQuery({
    queryKey: ["linkedin-connection", session?.user?.id],
    queryFn: fetchLinkedInConnection,
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
  });

  const isConnected = !!connection;
  const linkedinName = connection?.linkedin_name ?? null;

  const connectLinkedIn = useCallback(() => {
    const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
    if (!clientId) {
      toast.error("LinkedIn integration not configured");
      return;
    }

    // Generate random state for CSRF protection
    const state = crypto.randomUUID();
    sessionStorage.setItem(STATE_KEY, state);

    const redirectUri = `${window.location.origin}${REDIRECT_PATH}?linkedin=callback`;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: LINKEDIN_SCOPES,
      state,
    });

    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  }, []);

  const handleOAuthCallback = useCallback(async (code: string, state: string) => {
    // Validate state for CSRF
    const savedState = sessionStorage.getItem(STATE_KEY);
    sessionStorage.removeItem(STATE_KEY);

    if (!savedState || savedState !== state) {
      toast.error("LinkedIn authentication failed (invalid state)");
      return false;
    }

    const redirectUri = `${window.location.origin}${REDIRECT_PATH}?linkedin=callback`;

    try {
      const { data, error } = await supabase.functions.invoke("linkedin-connect", {
        body: { code, redirectUri },
      });

      if (error) {
        toast.error("Failed to connect LinkedIn");
        return false;
      }

      if (data?.error) {
        toast.error(data.error);
        return false;
      }

      toast.success(`Connected as ${data.linkedinName}`);
      queryClient.invalidateQueries({ queryKey: ["linkedin-connection"] });
      return true;
    } catch {
      toast.error("Failed to connect LinkedIn");
      return false;
    }
  }, [queryClient]);

  const disconnectLinkedIn = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke("linkedin-disconnect");

      if (error) {
        toast.error("Failed to disconnect LinkedIn");
        return;
      }

      toast.success("LinkedIn disconnected");
      queryClient.invalidateQueries({ queryKey: ["linkedin-connection"] });
    } catch {
      toast.error("Failed to disconnect LinkedIn");
    }
  }, [queryClient]);

  const postToLinkedIn = useCallback(async (
    postId: string | null,
    content: string,
    imageBase64?: string
  ): Promise<{ success: boolean; postUrl?: string; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke("post-to-linkedin", {
        body: { postId, content, imageBase64 },
      });

      if (error) {
        return { success: false, error: "Failed to post to LinkedIn" };
      }

      if (data?.error) {
        return { success: false, error: data.error };
      }

      return { success: true, postUrl: data.postUrl };
    } catch {
      return { success: false, error: "Failed to post to LinkedIn" };
    }
  }, []);

  return {
    isConnected,
    linkedinName,
    loading: !session ? false : isLoading,
    connectLinkedIn,
    handleOAuthCallback,
    disconnectLinkedIn,
    postToLinkedIn,
  };
}
