import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
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

      <main className="flex-1">
        <iframe
          src="/privacy-policy.html"
          title="Privacy Policy"
          className="w-full border-0"
          style={{ minHeight: "calc(100vh - 120px)" }}
        />
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
