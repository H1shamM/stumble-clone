# StumbleClone 🚀

**A modern, production-ready reimagining of the classic serendipitous discovery experience.**

---

## 🎯 Project Goal

StumbleClone aims to provide a fast, reliable, and serendipitous discovery engine for the open web. Built using **Modular Monolith** and **Hexagonal (Ports & Adapters)** design, it transforms the way users discover hidden gems online.

---

## ✨ Features (v2.0)

| Feature                     | Description                                              |
| :-------------------------- | :------------------------------------------------------- |
| **Serendipitous Discovery** | Weighted-random engine with URL dedup, per-session dedup, and per-source cooldown for variety. |
| **In-App Reading**          | Reader-first view extracts & sanitizes the article; **type-aware rendering** (article → reader, video → player, image/interactive → preview card). |
| **PWA Native Feel**         | Installable, offline-capable, and mobile-optimized.      |
| **Social Auth**             | Secure, seamless login via Google or GitHub (OAuth2).    |
| **Community Driven**        | Users can submit high-quality links for moderation.      |
| **Scalable Architecture**   | Hexagonal design ensures maintainability and modularity. |

> **🧭 Direction (Content & Rendering v2):** StumbleClone is evolving from a web prototype toward a
> **mobile discovery app**. Current focus is a curated, channel-organized content library and
> render-by-type with screenshot previews — informed by three structured product-eval sessions.
> See [`docs/PROGRESS.md`](docs/PROGRESS.md).

---

## 🛠️ Quick Start

### Prerequisites

- Node.js 20+
- npm (latest)

### 1. Backend API

```bash
cd app
npm install
npm start
```

_Note: The API seeds a local `stumble.db` on initial launch._

### 2. Frontend Web App

```bash
cd ui
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to start stumbling.

### 3. Browser Extension (Optional)

1. Run `./scripts/build-extension.sh`.
2. Load the `extension/` folder in Chrome via _Developer Mode_ in `chrome://extensions`.

---

## 📱 Mobile Experience

StumbleClone is a fully functional **Progressive Web App (PWA)**. Open the app in your mobile browser, then select **"Add to Home Screen"** for a seamless, native-like experience with offline caching.

---

## 🏗️ Architecture & Tech Stack

Built with professional engineering standards:

- **Backend:** Node.js, TypeScript, Express, Better-SQLite3
- **Frontend:** React, Vite, TypeScript, CSS Modules
- **Design Pattern:** Hexagonal (Ports & Adapters)
- **Quality Assurance:** Vitest (80%+ coverage goal), ESLint, Prettier

---

_Engineered with precision for the modern web._
[GitHub Repository](https://github.com/H1shamM/stumble-clone)
