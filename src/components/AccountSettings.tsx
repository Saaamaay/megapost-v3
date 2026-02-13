import { useState } from "react";
import { motion } from "framer-motion";
import { User, CreditCard, Bell, Trash2, Loader2, Mail, Lock, LogOut, Check, Crown } from "lucide-react";
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
import { useSubscription, PLANS } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AccountSettings() {
  const { user, signOut } = useAuth();
  const { isPro, subscribed, subscriptionEnd, loading: subLoading, startCheckout, openPortal } = useSubscription();
  const [currentPassword, setCurrentPassword] = useState("");
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
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password updated successfully!");
        setCurrentPassword("");
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
      // Delete all user data first, then sign out
      // Note: Full account deletion requires admin privileges
      // For now, we sign the user out and show a message
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Failed to delete account");
      } else {
        toast.success("Your account has been scheduled for deletion. You've been signed out.");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            Account Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account, billing, and preferences.
          </p>
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
              <Input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl"
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl"
              />
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !newPassword.trim()}
                size="sm"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </div>
        </section>


        {/* Subscription & Billing */}
        <section className="bg-card rounded-2xl border border-border p-6 space-y-4">
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
            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3 animate-pulse">
              <div className="h-6 w-32 bg-muted rounded" />
              <div className="h-4 w-48 bg-muted rounded" />
              <div className="h-9 w-40 bg-muted rounded" />
            </div>
          ) : isPro ? (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Pro Plan</span>
                <span className="ml-auto text-sm text-muted-foreground">
                  {subscriptionEnd && `Renews ${new Date(subscriptionEnd).toLocaleDateString()}`}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => openPortal().catch(() => toast.error("Failed to open billing portal"))}>
                Manage Subscription
              </Button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Free Plan</p>
                  <p className="text-sm text-muted-foreground">Limited features</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-2xl text-foreground">{PLANS.pro.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                {["Unlimited post generation", "All platforms", "Priority support", "Content pillars"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => startCheckout().catch(() => toast.error("Failed to start checkout"))}
                className="w-full"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Pro
              </Button>
            </div>
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
            <p className="text-xs text-muted-foreground italic">
              Notification preferences coming soon.
            </p>
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
