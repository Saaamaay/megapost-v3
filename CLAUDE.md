# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run lint         # ESLint check (pre-existing errors — not blocking)
npx playwright test  # E2E tests (needs dev server + E2E_TEST_EMAIL/PASSWORD env vars)
```

Other scripts (`dev`, `build`, `test`, `test:watch`) are in `package.json`.

Tests use Vitest with jsdom environment and globals enabled (no need to import describe/it/expect). Test files go in `src/**/*.{test,spec}.{ts,tsx}`. Playwright E2E tests go in `e2e/`.

Supabase edge functions live in `supabase/functions/` and are written in Deno/TypeScript — they run on Supabase's infrastructure, not locally via npm. Deploy with `supabase functions deploy`.

## Hosting & Infrastructure

- **Frontend**: Hosted on Vercel, deployed from the `migrate-to-self-hosted` branch
- **Backend**: Self-hosted Supabase project (`hikmqcmztoenkvxzoxjl`)
- **Domain**: megapost.ai
- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`) — runs lint, test, build on push/PR to `migrate-to-self-hosted`
- **Error tracking**: Sentry (`VITE_SENTRY_DSN`) — captures exceptions, browser tracing (10%), session replay on errors
- **Analytics**: PostHog (`VITE_POSTHOG_KEY`) — autocapture + custom events via `src/lib/analytics.ts`
- **Edge functions**: All 15 deployed to Supabase with `verify_jwt = false` (functions handle their own auth)
- **Secrets** (set via `supabase secrets set`): `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
- **Frontend env** (Vercel + `.env`): `VITE_LINKEDIN_CLIENT_ID`, `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY`
- **LinkedIn Developer Portal**: redirect URI must be `https://www.megapost.ai/` (with `www` and trailing slash — must match `window.location.origin` exactly)

## Architecture

**Megapost** is an AI-powered SaaS that generates social media posts in a user's brand voice. React/TypeScript frontend with a Supabase backend (PostgreSQL + Deno edge functions).

### Frontend (src/)

Standard Vite/React layout: `pages/`, `components/` (with `components/ui/` holding shadcn/ui Radix primitives), `hooks/`, `lib/`, `integrations/supabase/`. Sentry and PostHog init in `lib/` both no-op when their env keys are absent, so local dev doesn't need them.

### Testing (src/test/)

Hook tests are co-located with the hooks (`src/hooks/*.test.{ts,tsx}`); shared setup, mocks, and provider wrappers live in `src/test/`. E2E specs in `e2e/` require `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD` pointing to a dedicated Supabase test account.

### Backend (supabase/)

Edge functions handle server-side logic:
- `generate-posts` — calls Gemini AI API with voice profile context to produce platform-specific posts
- `check-subscription` / `create-checkout` / `customer-portal` — Stripe billing integration
- `generate-initial-pillars` / `generate-single-pillar` — AI-generated content pillars
- `analyze-images` — image processing for post context
- `admin-stats` — admin dashboard metrics
- `linkedin-connect` — OAuth token exchange (code → tokens + profile, upserts linkedin_connections)
- `linkedin-disconnect` — removes linkedin_connections row
- `post-to-linkedin` — publishes text/image posts to LinkedIn, handles token refresh. Uses `LinkedIn-Version: 202602` header (versions expire yearly — update if LinkedIn returns `NONEXISTENT_VERSION`).
- `delete-account`, `send-welcome-email`, `send-subscription-email`, `check-trial-expiring` — lifecycle functions

Database migrations are in `supabase/migrations/`. Push with `supabase db push`.

### Key Data Model

- **voice_profiles** — user's AI voice settings (tone scales, business info, sample posts, brand beliefs)
- **generated_posts** — history of AI-generated posts (includes `linkedin_post_url`, `linkedin_shared_at` for direct posting)
- **linkedin_connections** — LinkedIn OAuth tokens (one per user, ON DELETE CASCADE). RLS: users can SELECT own row; writes via service role in edge functions.
- **content_pillars** — user's brand topics/themes
- **user_roles** — role-based access (admin)
- **deleted_accounts** — hashed emails for trial abuse prevention
- **welcome_emails_sent** — tracks onboarding email delivery

### Path Alias

Always use `@/` imports (maps to `./src/`).

### Subscription Tiers

Free tier: 7-day trial with Premium-level access. Paid tiers (Standard £10, Premium £20, Professional £30) with varying platform and profile limits.

## Stack

Frontend deps are in `package.json`. Edge-function deps (Stripe, Google Gemini AI, Resend) are **not** — Deno imports them via ESM/npm URLs inside `supabase/functions/`.

## TypeScript Config

`strictNullChecks` and `noImplicitAny` are **disabled**. The codebase uses relaxed TypeScript settings — match the existing style rather than tightening strictness.
