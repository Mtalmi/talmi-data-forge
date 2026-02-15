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
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => {
      // If the SW isn't from vite-plugin-pwa, unregister it
      if (reg.active?.scriptURL?.endsWith('/sw.js')) {
        reg.unregister().then(() => {
          console.log('TBOS: Stale SW unregistered, reloading...');
          window.location.reload();
        });
      }
    });
  });
}
