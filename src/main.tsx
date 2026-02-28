import { createRoot } from "react-dom/client";
import { initSentry } from "./lib/sentry";
import { initPostHog } from "./lib/posthog";
import App from "./App.tsx";
import "./index.css";

initSentry();
initPostHog();

createRoot(document.getElementById("root")!).render(<App />);
