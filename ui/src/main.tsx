/**
 * @fileoverview Application entry point.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import "./globals.css";
import App from "./App.tsx";
import { ToastProvider } from "./contexts/ToastContext.tsx";

/**
 * Initializes the React application.
 */
const rootElement = document.getElementById("root");

if (rootElement) {
  // Set native status bar to indigo brand color
  if (Capacitor.isNativePlatform()) {
    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.setBackgroundColor({ color: "#4f46e5" }); // indigo brand
  }

  createRoot(rootElement).render(
    <StrictMode>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StrictMode>,
  );
} else {
  console.error("Root element not found");
}
