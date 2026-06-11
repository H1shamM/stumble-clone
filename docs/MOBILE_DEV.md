# Mobile Development Loop

This project uses Capacitor to wrap the React (Vite) frontend for Android.

## Standard Loop (Bundled)

Use this for final testing and production-like behavior. The app loads assets from the local `dist/` folder.

1.  **Build the UI:**
    ```bash
    cd ui && npm run build
    ```
2.  **Sync to Android:**
    ```bash
    npx cap sync android
    ```
3.  **Run/Open in Android Studio:**
    ```bash
    npx cap open android
    ```
    Or use the convenience script:
    ```bash
    npm run cap:android
    ```

## Live-Reload Loop (Development)

Use this to see changes instantly on a physical device or emulator without re-building.

1.  **Find your local IP address** (e.g., `192.168.1.50`).
2.  **Start the Vite dev server with host access:**
    ```bash
    cd ui && npm run cap:dev
    ```
3.  **Run the app with the dev URL:**
    In a new terminal:
    ```bash
    cd ui
    CAP_DEV_URL=http://<YOUR_IP>:5173 npx cap run android
    ```

The `ui/capacitor.config.ts` will automatically point to your dev server when `CAP_DEV_URL` is set, allowing for instant updates as you edit React code.
