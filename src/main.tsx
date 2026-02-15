import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./mobile-enhancements.css";
import "./i18n";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('TBOS: Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('TBOS: Service Worker registration failed:', error);
      });
  });
}
// Trigger rebuild - Thu Jan 29 10:25:01 EST 2026
