import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { setBackendPort } from "@/lib/api";

async function init() {
  if (window.electronAPI && window.electronAPI.getBackendPort) {
    let port = null;
    let attempts = 0;
    const maxAttempts = 50; // 50 attempts * 200ms = 10 seconds max wait

    while (attempts < maxAttempts) {
      try {
        port = await window.electronAPI.getBackendPort();
        if (port) {
          setBackendPort(port);
          console.log(`[Frontend] Resolved backend port: ${port} (attempt ${attempts + 1})`);
          break;
        }
      } catch (e) {
        console.error("[Frontend] Error resolving backend port:", e);
      }
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (!port) {
      console.warn("[Frontend] Failed to resolve backend port after maximum attempts. Using defaults.");
    }
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

init();
