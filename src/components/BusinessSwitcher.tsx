import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronDown, Check, Plus, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface BusinessSwitcherProps {
  onAddNew?: () => void;
}

export function BusinessSwitcher({ onAddNew }: BusinessSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { voiceProfile, allProfiles, switchProfile, signOut } = useAuth();

  if (!voiceProfile || allProfiles.length === 0) return null;

  const handleSelect = async (profileId: string) => {
    if (profileId !== voiceProfile.id) {
      await switchProfile(profileId);
    }
    setIsOpen(false);
  };

  const handleAddNew = () => {
    setIsOpen(false);
    onAddNew?.();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
          "bg-muted/50 hover:bg-muted border border-border",
          "text-foreground"
        )}
      >
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="max-w-[120px] truncate">{voiceProfile.profileName}</span>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 z-50 min-w-[200px] bg-card border border-border rounded-xl shadow-lg overflow-hidden"
            >
              <div className="py-1">
                {allProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelect(profile.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      "hover:bg-muted/50",
                      profile.id === voiceProfile.id && "bg-primary/5"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {profile.profileName}
                      </div>
                      {profile.businessType && (
                        <div className="text-xs text-muted-foreground truncate">
                          {profile.businessType}
                        </div>
                      )}
                    </div>
                    {profile.id === voiceProfile.id && (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="border-t border-border">
                <button
                  onClick={handleAddNew}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50"
                >
                  <Plus className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Add new business
                  </span>
                </button>
              </div>

              <div className="border-t border-border">
                <button
                  onClick={() => { setIsOpen(false); signOut(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50 text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Sign out
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
