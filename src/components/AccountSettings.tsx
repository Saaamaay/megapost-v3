import { useState } from "react";
import { motion } from "framer-motion";
import { User, CreditCard, Bell, Trash2, Loader2, Mail, Lock, Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, PLANS, FREE_PLAN, type SubscriptionTier } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TIER_FEATURES: Record<string, { features: string[]; highlight?: boolean }> = {
  standard: {
    features: ["Unlimited post generation", "1 platform", "1 business profile", "Content pillars"],
  },
  premium: {
    features: ["Unlimited post generation", "All 5 platforms", "1 business profile", "Content pillars"],
    highlight: true,
  },
  professional: {
    features: ["Unlimited post generation", "All 5 platforms", "Up to 3 profiles", "Content pillars"],
  },
};

export function AccountSettings() {
  const { user, signOut } = useAuth();
  const { tier, subscribed, subscriptionEnd, loading: subLoading, startCheckout, openPortal } = useSubscription();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast.error("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error("Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) {
        toast.error("Failed to delete account");
        return;
      }
      await supabase.auth.signOut();
      toast.success("Your account, data, and subscription have been permanently deleted.");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const isPaid = tier !== "free";

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Account Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account, billing, and preferences.</p>
        </div>

        {/* Profile Basics */}
        <section className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">Profile</h2>
              <p className="text-muted-foreground text-sm">Your account details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Email</Label>
              <div className="flex items-center gap-2 mt-1.5 px-4 py-2.5 rounded-xl bg-muted/50 border border-border">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground text-sm">{user?.email}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium text-foreground">Change Password</Label>
              </div>
              <Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl" />
              <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="rounded-xl" />
              <Button onClick={handleChangePassword} disabled={isChangingPassword || !newPassword.trim()} size="sm">
                {isChangingPassword ? (<><Loader2 className="w-4 h-4 animate-spin" />Updating...</>) : "Update Password"}
              </Button>
            </div>
          </div>
        </section>

        {/* Subscription & Billing */}
        <section className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">Subscription & Billing</h2>
              <p className="text-muted-foreground text-sm">Manage your plan and payment</p>
            </div>
          </div>

          {subLoading ? (
            <div className="grid gap-4 md:grid-cols-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
                  <div className="h-6 w-24 bg-muted rounded" />
                  <div className="h-8 w-16 bg-muted rounded" />
                  <div className="h-4 w-32 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Current plan banner for paid users */}
              {isPaid && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground capitalize">{tier} Plan</span>
                    {subscriptionEnd && (
                      <span className="text-sm text-muted-foreground ml-2">
                        Renews {new Date(subscriptionEnd).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openPortal().catch(() => toast.error("Failed to open billing portal"))}>
                    Manage Subscription
                  </Button>
                </div>
              )}

              {/* Pricing cards */}
              <div className="grid gap-4 md:grid-cols-3">
                {(Object.entries(PLANS) as [Exclude<SubscriptionTier, "free">, typeof PLANS[keyof typeof PLANS]][]).map(([planKey, plan]) => {
                  const isCurrent = tier === planKey;
                  const tierInfo = TIER_FEATURES[planKey];
                  const isHighlighted = tierInfo?.highlight;

                  return (
                    <div
                      key={planKey}
                      className={cn(
                        "relative rounded-xl border p-5 space-y-4 transition-all",
                        isCurrent
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : isHighlighted
                            ? "border-primary/30 bg-card"
                            : "border-border bg-card"
                      )}
                    >
                      {isCurrent && (
                        <span className="absolute -top-3 left-4 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                          Your Plan
                        </span>
                      )}
                      {isHighlighted && !isCurrent && (
                        <span className="absolute -top-3 left-4 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          Most Popular
                        </span>
                      )}

                      <div>
                        <h3 className="font-display font-bold text-foreground">{plan.name}</h3>
                        <p className="font-display font-bold text-2xl text-foreground mt-1">
                          {plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </p>
                      </div>

                      <ul className="space-y-2 text-sm">
                        {tierInfo?.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-muted-foreground">
                            <Check className="w-4 h-4 text-primary shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      {isCurrent ? (
                        <Button variant="outline" size="sm" className="w-full" disabled>
                          Current Plan
                        </Button>
                      ) : !isPaid ? (
                        <Button
                          variant={isHighlighted ? "default" : "outline"}
                          size="sm"
                          className="w-full"
                          onClick={() => startCheckout(plan.price_id).catch(() => toast.error("Failed to start checkout"))}
                        >
                          Upgrade
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Notification Preferences */}
        <section className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">Notifications</h2>
              <p className="text-muted-foreground text-sm">Choose what you'd like to hear about</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { id: "tips", label: "Content tips & inspiration", description: "Weekly ideas to keep your content fresh" },
              { id: "reminders", label: "Posting reminders", description: "Nudges when it's time to share something new" },
              { id: "updates", label: "Product updates", description: "New features and improvements" },
            ].map((pref) => (
              <div key={pref.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.description}</p>
                </div>
                <Switch disabled />
              </div>
            ))}
            <p className="text-xs text-muted-foreground italic">Notification preferences coming soon.</p>
          </div>
        </section>

        {/* Delete Account */}
        <section className="bg-card rounded-2xl border border-destructive/30 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-destructive/10">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">Danger Zone</h2>
              <p className="text-muted-foreground text-sm">Permanently delete your account and all data</p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account, all business profiles, generated posts, and content pillars. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount ? "Deleting..." : "Yes, delete my account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </motion.div>
    </main>
  );
}
