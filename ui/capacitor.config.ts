import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.stumbleclone.app",
  appName: "StumbleClone",
  // Wrap the existing Vite build output — wrap, do not rewrite (see docs/MOBILE_BUILD_PLAN.md).
  webDir: "dist",
  server: {
    // Dev: serve the app over http://localhost (not https) and allow cleartext
    // so the WebView can call the local HTTP backend (http://localhost:3000 via
    // `adb reverse tcp:3000 tcp:3000`) without mixed-content/cleartext blocking.
    // Production will move the API to https and these can be removed.
    androidScheme: "http",
    cleartext: true,
    ...(process.env.CAP_DEV_URL ? { url: process.env.CAP_DEV_URL } : {}),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#4f46e5",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
