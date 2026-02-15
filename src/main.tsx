import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./mobile-enhancements.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA Service Worker is auto-registered by vite-plugin-pwa (registerType: "autoUpdate")
// Force unregister any stale manual SW on first load
// Clean up only legacy manual SWs — do NOT touch vite-plugin-pwa's workbox SW
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => {
      const url = reg.active?.scriptURL ?? '';
      // vite-plugin-pwa generates SWs with hashed names or at /sw.js with workbox
      // Only unregister if it's NOT a workbox-managed SW (workbox SWs contain "workbox" in scope)
      const isLegacyManualSW = url.endsWith('/sw.js') && !reg.scope?.includes('workbox');
      if (isLegacyManualSW && !url.includes('workbox')) {
        reg.unregister().then(() => {
          console.log('TBOS: Stale legacy SW unregistered');
        });
      }
    });
  });
}
