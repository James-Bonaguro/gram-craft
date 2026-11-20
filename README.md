# GramCraft

> **Status**: Experimental portfolio prototype — AI-assisted first Antigravity build.  
> Not intended or claimed for commercial production, multi-tenant deployment, or direct social media publishing.

GramCraft is a local studio tool designed to draft, format, and organize Instagram Carousels (1080 × 1350 px) and Reel storyboard scripts. It combines structured layout templates, custom brand kits, and optional AI-assisted drafting via Google Gemini.

---

## Quick Start

### 1. Requirements
- Node.js 18+ (tested with Node 20+)
- npm

### 2. Installation & Setup
```bash
# Clone or navigate to the repository
cd /Users/jamesbonaguro/Dev/gram-craft

# Install dependencies
npm install

# Initialize SQLite database schema
npx prisma db push

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Core Capabilities

### 1. Carousel Studio (`/studio/carousel`)
- **Slide Templates**: 5 slide types (`COVER`, `CONTENT`, `COMPARISON`, `QUOTE`, `CTA`) across 4 visual styles (`minimal`, `tweet`, `bold`, `infographic`).
- **Typography & Styling**: Uses local/system font stacks (`Inter`, `System UI`, `Georgia`, `Mono`, `Helvetica`) without external font service dependencies. Contrast algorithms dynamically adjust text luminance for dark and light palette modes.
- **Content Editing**: Edit headlines, subheadlines, body copy, structured bullet points, badges, quote authors, captions, and hashtags. Excess text warning indicators flag copy that exceeds typical slide dimensions.
- **Exporting**: Bundles validated 1080 × 1350 PNG images and copy text into a downloadable ZIP archive, or exports directly to a designated local directory.

### 2. Reel Studio (`/studio/reel`)
- **Beat-by-Beat Storyboarding**: Structure video ideas into sequential beats (`HOOK`, `BODY`, `TRANSITION`, `CTA`) with visual action cues, spoken dialogue, and text overlays.
- **Interactive Teleprompter**: Built-in full-screen teleprompter with adjustable reading speed (WPM), font size scaling, auto-scroll, timer tracking, and mirrored mode for recording setups. All timers and animation frames automatically cancel on modal close.

### 3. Brand Kits (`/brand-kits`)
- Store reusable visual identities: distinct internal kit names, public handle (`@handle`), public display name, primary/secondary/accent color hexes, and font configurations.

---

## Demo Mode vs. Real AI Generation

- **Explicit Demo Mode**: When the `Use Demo Template` toggle is enabled, GramCraft generates deterministic sample carousels and storyboard scripts locally without hitting external APIs. All demo output is explicitly prefixed with `[Demo]`.
- **Live Gemini AI Generation**: When Demo Mode is disabled, requests require a valid Google Gemini API key configured in Settings (`/settings`) or through the `GEMINI_API_KEY` environment variable.
- **Strict Validation**: Generation returns structured errors if credentials are missing, network requests fail, or the returned JSON does not match the strict schema. Failed requests never silently fall back to synthetic output disguised as real AI.
- **Honest Metrics**: Arbitrary "viral retention" or engagement prediction metrics have been removed.

---

## Local Directory Export vs. Cloud Sync

- **Truthful Status**: The app exports bundles to a local filesystem directory (e.g., a mounted Google Drive directory path on macOS such as `~/Library/CloudStorage/...`).
- **No Direct Cloud Auth**: GramCraft does not connect directly to Google Drive APIs or OAuth; it writes files to a local folder.
- **Collision Prevention**: Export operations automatically append sequential numbering (`_1`, `_2`) if a folder with the same project name already exists, preventing accidental data overwrites.

---

## Verified vs. Unverified Features

| Feature | Status | Verification Details |
|---|---|---|
| **Transactional Project Saving** | **Verified** | Wrapped in Prisma atomic transactions; failed slide saves roll back completely; project ID retained after initial save to prevent duplicates. |
| **Settings Restoration & Persistence** | **Verified** | Project input mode, raw input text, brand kit, captions, hashtags, and template styles persist across reload. |
| **Secret Masking** | **Verified** | API keys are masked in GET endpoints (`AIza...XXXX`) and protected against accidental blank overwrites. |
| **1080 × 1350 PNG & ZIP Packaging** | **Verified** | Every slide element is validated for PNG headers and exact 1080 × 1350 resolution prior to ZIP generation. |
| **Teleprompter Animation Cleanup** | **Verified** | `requestAnimationFrame` and interval timers clean up immediately on close, pause, or ESC keypress. |
| **System Typography & Contrast** | **Verified** | System font stacks applied cleanly across all four templates without external network calls; light/dark luminance contrast maintained. |
| **Direct Meta Graph API Publishing** | **Unverified / Unsupported** | GramCraft does not connect to Meta Graph API or schedule live Instagram posts. |
| **Direct Cloud Drive OAuth Sync** | **Unverified / Unsupported** | Cloud storage sync relies entirely on local filesystem folder mounting. |

---

## Known Limitations

1. **Simple Template Editor**: Not a freeform graphic design canvas (like Canva or Figma). Slide layouts adhere strictly to predefined responsive CSS grid/flex structures.
2. **Local Storage**: Designed for single-user local SQLite operation (`dev.db`). Not built for multi-user authorization or concurrent editing.
3. **API Key Storage**: API keys are stored in the local SQLite `AppSetting` table for personal convenience. Ensure the SQLite database file remains local and is not shared publicly.

---

## License

Personal exploration and portfolio project.
