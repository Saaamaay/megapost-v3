# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on localhost:8080
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Run unit tests once (vitest)
npm run test:watch   # Run tests in watch mode
```

Tests use Vitest with jsdom environment and globals enabled (no need to import describe/it/expect). Test files go in `src/**/*.{test,spec}.{ts,tsx}`. Playwright is available for E2E tests.

Supabase edge functions live in `supabase/functions/` and are written in Deno/TypeScript — they run on Supabase's infrastructure, not locally via npm. Deploy with `supabase functions deploy`.

## Hosting & Infrastructure

- **Frontend**: Hosted on Vercel, deployed from the `migrate-to-self-hosted` branch
- **Backend**: Self-hosted Supabase project (`hikmqcmztoenkvxzoxjl`)
- **Domain**: megapost.ai
- **Edge functions**: All 15 deployed to Supabase with `verify_jwt = false` (functions handle their own auth)
- **Secrets** (set via `supabase secrets set`): `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
- **Frontend env** (Vercel + `.env`): `VITE_LINKEDIN_CLIENT_ID` — needed for OAuth redirect

## Architecture

**Megapost** is an AI-powered SaaS that generates social media posts in a user's brand voice. React/TypeScript frontend with a Supabase backend (PostgreSQL + Deno edge functions).

### Frontend (src/)

- **Pages** (`src/pages/`): Route-level components — Index (main dashboard), Auth, Admin, Privacy, Terms
- **Components** (`src/components/`): App-specific UI. Key ones:
  - `VoiceSetup` — voice profile creation (tone sliders, sample posts, brand beliefs)
  - `ContentGenerator` — main post generation flow (platform + description + image → AI posts)
  - `PostCard` / `PostHistory` — display and browse generated posts
  - `BusinessSwitcher` — multi-profile switching
  - `AccountSettings` — billing/subscription management via Stripe
- **components/ui/** — shadcn/ui primitives (Radix-based). Configured in `components.json`.
- **Hooks** (`src/hooks/`):
  - `useAuth` — auth state, voice profile CRUD, profile switching. Exposes `VoiceProfile` interface.
  - `useSubscription` — calls `check-subscription` edge function, returns `tier` and `isPaid`
  - `usePostLimit` — enforces daily generation limits per subscription tier
  - `useLinkedIn` — LinkedIn OAuth, connection status, direct posting
  - `useContentPillars` — CRUD for brand content topics
- **Integrations** (`src/integrations/supabase/`): Supabase client init and auto-generated DB types

### Backend (supabase/)

Edge functions handle server-side logic:
- `generate-posts` — calls Gemini AI API with voice profile context to produce platform-specific posts
- `check-subscription` / `create-checkout` / `customer-portal` — Stripe billing integration
- `generate-initial-pillars` / `generate-single-pillar` — AI-generated content pillars
- `analyze-images` — image processing for post context
- `admin-stats` — admin dashboard metrics
- `linkedin-connect` — OAuth token exchange (code → tokens + profile, upserts linkedin_connections)
- `linkedin-disconnect` — removes linkedin_connections row
- `post-to-linkedin` — publishes text/image posts to LinkedIn, handles token refresh
- `delete-account`, `send-welcome-email`, `send-subscription-email`, `check-trial-expiring` — lifecycle functions

Database migrations are in `supabase/migrations/`. Push with `supabase db push`.

### Key Data Model

- **voice_profiles** — user's AI voice settings (tone scales, business info, sample posts, brand beliefs)
- **generated_posts** — history of AI-generated posts (includes `linkedin_post_url`, `linkedin_shared_at` for direct posting)
- **linkedin_connections** — LinkedIn OAuth tokens (one per user, ON DELETE CASCADE)
- **content_pillars** — user's brand topics/themes
- **user_roles** — role-based access (admin)
- **deleted_accounts** — hashed emails for trial abuse prevention
- **welcome_emails_sent** — tracks onboarding email delivery

### Path Alias

`@/` maps to `./src/` (configured in tsconfig.json, vite.config.ts, and vitest.config.ts). Always use `@/` imports.

### Subscription Tiers

Free tier: 3 posts/day. Paid tiers (Standard £10, Premium £20, Professional £30) with varying platform and profile limits.

## Stack

**Frontend (npm):** React 18 + TypeScript, Vite (SWC), Tailwind CSS, shadcn/ui (Radix), TanStack React Query, React Router DOM, Supabase JS, Recharts, Framer Motion, React Hook Form + Zod.

**Edge functions (Deno):** Stripe, Google Gemini AI, Resend (email). These are imported via ESM/npm in Deno, not in package.json.

## TypeScript Config

`strictNullChecks` and `noImplicitAny` are **disabled**. The codebase uses relaxed TypeScript settings — match the existing style rather than tightening strictness.
