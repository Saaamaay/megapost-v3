import { NavBar } from "@/components/NavBar";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
          >
            <span className="font-display font-extrabold text-xl sm:text-2xl text-foreground tracking-tight">
              megapost<span className="text-primary">.ai</span>
            </span>
          </button>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm text-muted-foreground">
            Paste your Termly privacy policy content below by editing this file at{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">src/pages/Privacy.tsx</code>
          </p>
          {/* PASTE YOUR TERMLY PRIVACY POLICY CONTENT HERE */}
          {/* Replace this placeholder with your actual policy text */}
          <p>Your privacy policy content goes here.</p>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
