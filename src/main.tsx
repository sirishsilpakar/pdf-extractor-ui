import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { setBackendPort } from "@/lib/api";

async function init() {
  if (window.electronAPI && window.electronAPI.getBackendPort) {
    try {
      const port = await window.electronAPI.getBackendPort();
      if (port) {
        setBackendPort(port);
        console.log(`[Frontend] Resolved backend port: ${port}`);
      }
    } catch (e) {
      console.error("[Frontend] Failed to resolve backend port via Electron:", e);
    }
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

init();
