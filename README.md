# Megapost

AI-powered social post generator that writes in **your brand voice** — not generic LLM voice.

Users build a voice profile (tone sliders, sample posts, brand beliefs, content pillars), then generate platform-specific posts from a short description and optional image. Full SaaS wrapper: free trial, three paid tiers via Stripe, one-click direct publishing to LinkedIn, admin dashboard.

> **Status:** working application, built January–February 2026 (~340 commits), developed with Claude Code. Not currently hosted — see the demo below, or run it locally in two minutes.

## Demo

<!-- TODO: demo.gif — record: sign in → voice profile → generate posts → copy/post -->

## Features

- **Voice profiles** — tone scales, business context, sample posts and brand beliefs steer every generation; multiple business profiles per account
- **Post generation** — platform + description + optional image (Gemini vision) → ready-to-publish posts per platform
- **Content pillars** — AI-suggested brand topics that keep output on-strategy
- **LinkedIn direct posting** — OAuth connect, one-click publish with token refresh handling
- **Billing** — Stripe checkout, customer portal, tiered generation limits, 7-day trial with abuse prevention
- **Lifecycle email** — welcome and trial-expiry emails via Resend
- **Admin dashboard** — usage stats and per-user generation counts
- **Production hygiene** — Sentry error tracking + session replay, PostHog analytics, error boundaries, CI (lint/test/build) on GitHub Actions

## Architecture

React 18 + TypeScript SPA (Vite, Tailwind, shadcn/ui, TanStack Query) on a Supabase backend: Postgres with row-level security plus 15 Deno edge functions handling everything server-side — Gemini generation, Stripe billing, LinkedIn OAuth/publishing, transactional email, account lifecycle.

```
src/
  pages/          Index (dashboard), Auth, Admin, Privacy, Terms
  components/     VoiceSetup, ContentGenerator, PostHistory, BusinessSwitcher, ...
  hooks/          useAuth, useSubscription, usePostLimit, useLinkedIn, useContentPillars
  lib/            sentry, posthog, typed analytics events
supabase/
  functions/      generate-posts, create-checkout, post-to-linkedin, admin-stats, ... (15)
  migrations/     Postgres schema + RLS policies
```

Secrets (Gemini, Stripe, Resend, LinkedIn) live exclusively in Supabase's secret store, server-side. The client env (`.env.example`) contains only publishable values.

## Run locally

```bash
npm install
cp .env.example .env   # add your Supabase project values
npm run dev            # http://localhost:8080
```

Backend requires a Supabase project with the migrations applied (`supabase db push`) and edge functions deployed (`supabase functions deploy`).

## Tests

```bash
npm test               # 32 unit tests (Vitest + Testing Library)
npx playwright test    # E2E scaffolding (needs a dedicated test account)
```

## History

Started as a Lovable prototype, then migrated to a self-hosted Supabase stack (`migrate-to-self-hosted` branch — the deployed line): custom edge functions, CI/CD, monitoring, tests, and LinkedIn integration were all added post-migration. Previously live at megapost.ai.
