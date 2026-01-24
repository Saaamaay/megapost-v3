import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Home, PenSquare, Settings, LogOut, LogIn, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessSwitcher } from "@/components/BusinessSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavBarProps {
  onNavigate?: (view: "hero" | "generator" | "edit" | "pillars") => void;
  currentView?: "hero" | "generator" | "edit" | "setup" | "pillars";
  onAddNewBusiness?: () => void;
}

export function NavBar({ onNavigate, currentView, onAddNewBusiness }: NavBarProps) {
  const { user, loading, signOut, voiceProfile, allProfiles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isAuthPage = location.pathname === "/auth";

  const navItems = [
    {
      id: "hero" as const,
      label: "Home",
      icon: Home,
      show: true,
    },
    {
      id: "pillars" as const,
      label: "Ideas",
      icon: Lightbulb,
      show: !!voiceProfile,
    },
    {
      id: "generator" as const,
      label: "Create",
      icon: PenSquare,
      show: !!voiceProfile,
    },
    {
      id: "edit" as const,
      label: "Voice Profile",
      icon: Settings,
      show: !!voiceProfile,
    },
  ];

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between relative">
        {/* Logo */}
        <button
          onClick={() => onNavigate?.("hero")}
          className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity z-10"
        >
          <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-warm shadow-glow">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg sm:text-xl text-foreground">
            PostPilot
          </span>
        </button>

        {/* Center Navigation - Absolutely positioned for true centering */}
        {user && voiceProfile && !isAuthPage && (
          <div className="hidden sm:flex items-center gap-1 bg-muted/50 rounded-full p-1 absolute left-1/2 -translate-x-1/2">
            {navItems.filter(item => item.show).map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-primary rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Right side - Business Switcher & Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Business Switcher - only show when logged in with profile */}
          {user && voiceProfile && allProfiles.length > 0 && !isAuthPage && (
            <BusinessSwitcher onAddNew={onAddNewBusiness} />
          )}
          
          {loading ? null : user ? (
            <>
              {/* Mobile nav buttons */}
              {voiceProfile && !isAuthPage && (
                <div className="flex sm:hidden items-center gap-1">
                  {navItems.filter(item => item.show && item.id !== "hero").map((item) => {
                    const isActive = currentView === item.id;
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onNavigate?.(item.id)}
                        className="h-9 w-9 p-0"
                      >
                        <item.icon className="w-4 h-4" />
                      </Button>
                    );
                  })}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : !isAuthPage ? (
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
              <LogIn className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
