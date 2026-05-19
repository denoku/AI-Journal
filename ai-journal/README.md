# Brian's Journal

A full-stack AI-powered personal journal app. Mobile-first, dark theme, designed to live on your iPhone home screen as a PWA.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript**
- **Tailwind CSS v4** + shadcn-style components
- **Drizzle ORM** + **Neon** (serverless Postgres)
- **Anthropic Claude** (`claude-sonnet-4-20250514`) for AI chat
- **NextAuth v5** with GitHub OAuth (JWT sessions)

## Features

- **Journal** — Morning / Midday / Evening tabs with auto-save
  - Morning: daily note, intention chips (max 5 from life areas), meal planner
  - Midday: intentions recap + check-in note
  - Evening: habit toggles, reflection, wins, intentions recap
- **AI Chat** — per-day persistent chat with Claude, streamed responses, full journal context as system prefix
- **Habit Tracker** — 7-day grid + streak counter per tracked habit (🔥 3+, 🏆 7+)
- **Recipe Journal** — CRUD with category filter, detail view, auto-seeded with 2 starter cookie recipes
- **Weekly Summary** — 7-day log grid, habit completion bars, top intentions, wins
- **PWA** — installable on iPhone from Safari (Add to Home Screen), dark status bar

## Setup

### 1. Clone & install

```bash
npm install
```

### 2. Environment variables

Copy `.env.local` and fill in:

```bash
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Neon serverless Postgres
DATABASE_URL=postgresql://...

# NextAuth
AUTH_SECRET=<generate with: openssl rand -base64 32>

# GitHub OAuth app (https://github.com/settings/apps/new)
# Callback URL: http://localhost:3000/api/auth/callback/github
GITHUB_ID=...
GITHUB_SECRET=...
```

### 3. Create database tables

```bash
npm run db:push
```

This pushes the schema to your Neon database:
- `journal_entries` — daily journal data (intentions, meals, notes, habits)
- `chat_messages` — per-day AI chat history
- `recipes` — recipe journal

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to sign in with GitHub.

## Database commands

```bash
npm run db:push      # Push schema to DB (no migration files)
npm run db:generate  # Generate migration files
npm run db:studio    # Open Drizzle Studio
```

## PWA / iPhone Installation

1. Deploy the app (Vercel recommended)
2. Open in Safari on iPhone
3. Tap Share → Add to Home Screen
4. It'll launch fullscreen with dark status bar

Icons: Add `icons/icon-192.png` and `icons/icon-512.png` to `public/` for proper PWA icons.

## Life Areas (Intention Picker)

`freelance, dsa, bike, dogs, daughter, cats, garden, baking, cooking, reading, show, games, coffee, recipes, brands, compost, lickmat, learn`

## Tracked Habits (Evening + Habit Tracker)

`bike, dogs, dsa, reading, garden, daughter`

## Recipe Categories

`Pizza, Bread, Sweets, Coffee, Cooking, Other`

## Deploy

```bash
npm run build
```

Recommended: Deploy to [Vercel](https://vercel.com) — add env vars in the project settings.
