# [GramCraft](https://gram-craft.vercel.app/) 🎨

> **A fast, local-first studio for crafting high-converting Instagram Carousels & Reel storyboards.**  
> Built with Next.js 15, React, Tailwind CSS, Prisma, SQLite, and Google Gemini AI.

---

## Overview

GramCraft brings structure, typography, and speed to Instagram content creation. Instead of fighting clunky drag-and-drop design canvases or messy text files, GramCraft gives creators and developers an opinionated, high-productivity studio:

- **Carousel Studio**: Rapidly draft 1080 × 1350 px multi-slide carousels across proven archetypes (`COVER`, `CONTENT`, `COMPARISON`, `QUOTE`, `CTA`) with 4 distinct design styles.
- **Reel Studio & Teleprompter**: Script video beats (visual cues, spoken dialogue, on-screen text) and rehearse directly inside a built-in, mirrored full-screen teleprompter.
- **Brand Kits**: Maintain consistent visual identities with custom color palettes, public handles, and font pairings.
- **Gemini AI + Offline Demo Mode**: Generate carousels and storyboard scripts from raw ideas or notes, or use instant demo templates with zero setup.
- **Reliable Local Export**: Download production-ready ZIP bundles or sync directly into your local Google Drive folder with automatic versioning.

---

## Features

### 📸 Carousel Studio (`/studio/carousel`)
- **5 Slide Archetypes**:
  - `COVER`: High-impact title hooks with badge tags.
  - `CONTENT`: Structured body text and interactive bullet points.
  - `COMPARISON`: Side-by-side pitfall vs. solution breakdown.
  - `QUOTE`: Focused insight card with author attribution.
  - `CTA`: Final slide call-to-action with handle branding.
- **4 Design Styles**: `Minimal`, `Tweet-style`, `Bold Contrast`, and `Infographic`.
- **Dynamic Contrast Engine**: Automatically calculates background luminance to ensure text remains sharp and legible across light, dark, and saturated color palettes.
- **Zero-Dependency Typography**: Pre-configured system font stacks (`Inter`, `System UI`, `Georgia`, `Mono`, `Helvetica`) that render instantly without external webfont latency.
- **Visual Overflow Warnings**: Real-time character counters and warning badges alert you before text exceeds 1080 × 1350 boundaries.

### 🎬 Reel Studio & Interactive Teleprompter (`/studio/reel`)
- **Beat-by-Beat Storyboarding**: Outline video flow across `HOOK`, `BODY`, `TRANSITION`, and `CTA` beats with estimated timing.
- **Director-Grade Teleprompter**:
  - Auto-scroll with configurable Words Per Minute (WPM: 80–220).
  - Dynamic font size scaling (24px–72px).
  - Mirrored mode for recording with phone or beam-splitter teleprompter setups.
  - Live timer tracking with clean lifecycle cleanup on pause or close.

### 🎨 Brand Kits (`/brand-kits`)
- Manage distinct visual identities: primary, secondary, background, card, and text colors.
- Separate internal brand management names from public slide footer branding (`@handle` and display name).

### ⚡ Smart Content Generation
- **Powered by Gemini 2.5 Flash**: Transform rough notes, blog posts, or concepts into structured 5–10 slide carousels and hook-driven video scripts.
- **One-Click Demo Mode**: Test and explore layouts instantly with built-in sample generation—no API key required.
- **Strict Data Validation**: Every AI response is validated against strict schemas before rendering.

### 📦 Local Export & Sync
- **ZIP Bundler**: Verifies and renders every slide as a crisp 1080 × 1350 PNG along with complete formatted caption and hashtag text.
- **Direct-to-Folder Sync**: Export directly to your local file path (e.g. mounted Google Drive folder).
- **Collision Protection**: Automatically versions exports (`_1`, `_2`) so you never accidentally overwrite existing decks.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Database**: SQLite with Prisma ORM (Atomic transactions & state persistence)
- **AI**: Google Gemini API via official REST interface
- **Export**: `html-to-image` for high-res DOM rasterization, `JSZip` for packaging

---

## Quick Start

### 1. Prerequisites
- Node.js 18+ (tested on Node 20 / 22)
- npm

### 2. Setup & Run
```bash
# Clone the repository
cd /Users/jamesbonaguro/Dev/gram-craft

# Install dependencies
npm install

# Initialize local database
npx prisma db push

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start creating!

---

## Configuration

Settings are managed locally at `/settings` or in `.env`:
- **Gemini API Key**: Add your key in the app Settings UI (securely masked and stored locally in SQLite) or set `GEMINI_API_KEY` in `.env`.
- **Export Directory**: Configure the destination folder for direct local exports (defaults to your local Google Drive sync folder or any directory on your machine).

---

## Project Structure

```
gram-craft/
├── prisma/
│   ├── schema.prisma       # SQLite data schema (Projects, Slides, Beats, Brands, Settings)
│   └── dev.db              # Local database
├── src/
│   ├── app/
│   │   ├── studio/carousel # Carousel creator & slide editor
│   │   ├── studio/reel     # Reel storyboarding studio
│   │   ├── brand-kits      # Multi-brand visual identity manager
│   │   ├── settings        # Local storage & API configuration
│   │   └── api/            # Next.js API route handlers
│   ├── components/
│   │   ├── carousel/       # SlideRenderer & template styles
│   │   ├── reel/           # TeleprompterModal & storyboard cards
│   │   └── export/         # ExportModal & PNG packager
│   └── lib/
│       ├── ai/             # Gemini integration & validation schemas
│       └── gdrive.ts       # Collision-safe local folder exporter
└── scripts/
    └── verify-gram-craft.ts # Automated test & verification suite
```

---

## Development & Verification

Run the verification suite to test database transactions, AI fallback validation, and collision-free exports:

```bash
# Run verification test suite
npx tsx scripts/verify-gram-craft.ts

# Type check & lint
npm run lint
npx tsc --noEmit

# Production build check
npm run build
```

---

## License

Personal exploration and portfolio project built with Antigravity.
