import { posthog } from "./posthog";

export const analytics = {
  signUp() {
    posthog.capture("sign_up");
  },

  postsGenerated(platforms: string[]) {
    posthog.capture("posts_generated", { platforms, count: platforms.length });
  },

  postCopied(platform: string) {
    posthog.capture("post_copied", { platform });
  },

  linkedinConnected() {
    posthog.capture("linkedin_connected");
  },

  linkedinPosted() {
    posthog.capture("linkedin_posted");
  },

  subscriptionStarted(tier: string) {
    posthog.capture("subscription_started", { tier });
  },

  voiceProfileCreated() {
    posthog.capture("voice_profile_created");
  },
};
