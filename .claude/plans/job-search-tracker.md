# Implementation Plan: Job Search Tracker

## Overview
Greenfield Next.js 14 App Router application. Project directory currently contains only `.gitignore`, `README.md`, and `.claude/`. Everything must be created from scratch.

---

## Phase 0 — Project Scaffolding
- Bootstrap Next.js 14 with TypeScript + Tailwind + ESLint + App Router + `src/` dir
- Install all dependencies: `prisma`, `@prisma/client`, `next-auth`, `bcrypt`, `node-cron`, `googleapis`, `ts-node`
- Init shadcn/ui (New York style, Zinc base color, CSS variables on)
- Create Docker Compose (`app` + `db` services)
- Create `.env.example` with all required variable names

## Phase 1 — Database Layer
- Write `prisma/schema.prisma` with all 5 tables (+ `gmail_thread_id`, `gmail_message_id` fields on `job_application` and `follow_up`)
- Create Prisma singleton `src/lib/prisma.ts`
- Write seed script `prisma/seed.ts` (admin user + default sync_schedule row)

## Phase 2 — Authentication
- `src/app/api/auth/[...nextauth]/route.ts` — CredentialsProvider against user table
- `src/lib/auth.ts` — shared `authOptions`
- `src/types/next-auth.d.ts` — extend Session with `id` and `role`
- `src/lib/session.ts` — `requireSession()` and `requireAdmin()` helpers
- `src/app/login/page.tsx` — login page

## Phase 3 — Core UI Shell
- Install shadcn components: button, badge, card, dialog, sheet, select, separator, skeleton, table, toast, sonner
- `src/app/layout.tsx` — SessionProvider + Toaster + global font/styles
- `src/components/Nav.tsx` — top nav with conditional Admin link
- `src/components/StatusBadge.tsx` — colored badge per status
- `src/components/SourceBadge.tsx` — colored badge per source
- `src/components/GlassCard.tsx` — reusable glassmorphism card wrapper

## Phase 4 — Dashboard Page
- `src/lib/applications.ts` — `getApplications(filters)` and `getSummaryStats(period)`
- `src/app/page.tsx` — server component, fetches data, passes to client components
- `src/components/dashboard/SummaryBar.tsx` — totals, response rate, status breakdown
- `src/components/dashboard/FilterBar.tsx` — Day/Week/Month/Year toggle + source filter + CSV export button
- `src/components/dashboard/ApplicationList.tsx` — table/cards, empty state
- `src/components/dashboard/ApplicationModal.tsx` — right-side Sheet, status update, follow-ups

## Phase 5 — API Routes
- `src/app/api/applications/route.ts` — GET (filtered list), POST (manual create)
- `src/app/api/applications/[id]/route.ts` — GET (single + follow-ups), PATCH (status update)
- `src/app/api/applications/export/route.ts` — GET CSV download
- `src/app/api/stats/route.ts` — GET summary stats
- `src/app/api/sync/route.ts` — POST trigger manual sync
- `src/app/api/sync-settings/route.ts` — GET/PUT sync schedule
- `src/app/api/admin/users/route.ts` — GET list, POST create (admin only)
- `src/app/api/admin/users/[id]/route.ts` — DELETE (admin only)

## Phase 6 — Gmail Integration
- `src/lib/gmail/client.ts` — OAuth2 client, token expiry detection
- `src/lib/gmail/parsers.ts` — parse application emails + follow-up emails
- `src/lib/gmail/matcher.ts` — match follow-ups to applications (thread ID → company → domain)
- `src/lib/gmail/sync.ts` — main `runGmailSync()` function
- `src/lib/gmail/tokenStatus.ts` — in-memory token expiry flag

## Phase 7 — Background Scheduler
- `server.ts` — custom Next.js server entry point
- `tsconfig.server.json` — separate tsconfig for server (commonjs)
- `src/lib/scheduler.ts` — node-cron initialization, reads schedule from DB each tick
- Update `package.json` start script to use custom server

## Phase 8 — Sync Settings Page
- `src/app/sync-settings/page.tsx` — server component, fetches schedule
- `src/components/sync/SyncSettingsForm.tsx` — client form + Sync Now button + last sync status

## Phase 9 — Admin Page
- `src/app/admin/page.tsx` — server component, requires admin
- `src/components/admin/UserTable.tsx` — user list + add/delete with confirmation dialog

## Phase 10 — Docker Production Config
- `Dockerfile` — multi-stage build (deps → builder → runner)
- `entrypoint.sh` — runs `prisma migrate deploy` then starts server
- Update `docker-compose.yml` with healthcheck, volumes, env_file

## Phase 11 — Tests
- `src/lib/gmail/__tests__/parsers.test.ts`
- `src/lib/gmail/__tests__/matcher.test.ts`
- `src/lib/gmail/__tests__/sync.test.ts`
- `src/app/api/applications/__tests__/route.test.ts`
- `src/app/api/auth/__tests__/auth.test.ts`
- `src/app/api/admin/__tests__/users.test.ts`
- `src/components/__tests__/StatusBadge.test.tsx`
- `src/components/__tests__/SummaryBar.test.tsx`

---

## Key Risks

1. **Gmail email format variability** — parse defensively, always fall back to `manual_review`
2. **node-cron + Next.js hot reload** — guard against duplicate cron registration; re-read schedule from DB each tick
3. **Gmail OAuth refresh token expiry** — detect `invalid_grant` specifically, show in-app alert
4. **Schema deviation from spec** — `job_application` and `follow_up` need `gmail_thread_id` / `gmail_message_id` for deduplication (confirmed)
5. **Response rate division by zero** — guard: return 0% when total applications = 0

---

## Schema Additions (vs. Original Spec)

`job_application` needs two extra fields:
- `gmail_thread_id TEXT` (nullable) — for follow-up matching
- `gmail_message_id TEXT` (nullable) — for deduplication

`follow_up` needs one extra field:
- `gmail_message_id TEXT` (nullable) — for deduplication

---

## Files to Create (51 total)

### Config
`package.json`, `tsconfig.json`, `tsconfig.server.json`, `next.config.ts`, `tailwind.config.ts`, `components.json`, `Dockerfile`, `docker-compose.yml`, `entrypoint.sh`, `.env.example`, `server.ts`

### Database
`prisma/schema.prisma`, `prisma/seed.ts`

### Types
`src/types/next-auth.d.ts`

### Lib
`src/lib/prisma.ts`, `src/lib/auth.ts`, `src/lib/session.ts`, `src/lib/applications.ts`, `src/lib/scheduler.ts`, `src/lib/gmail/client.ts`, `src/lib/gmail/parsers.ts`, `src/lib/gmail/matcher.ts`, `src/lib/gmail/sync.ts`, `src/lib/gmail/tokenStatus.ts`

### App
`src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/sync-settings/page.tsx`, `src/app/admin/page.tsx`

### API Routes
`src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/applications/route.ts`, `src/app/api/applications/[id]/route.ts`, `src/app/api/applications/export/route.ts`, `src/app/api/stats/route.ts`, `src/app/api/sync/route.ts`, `src/app/api/sync-settings/route.ts`, `src/app/api/admin/users/route.ts`, `src/app/api/admin/users/[id]/route.ts`

### Components
`src/components/Nav.tsx`, `src/components/StatusBadge.tsx`, `src/components/SourceBadge.tsx`, `src/components/GlassCard.tsx`, `src/components/dashboard/SummaryBar.tsx`, `src/components/dashboard/FilterBar.tsx`, `src/components/dashboard/ApplicationList.tsx`, `src/components/dashboard/ApplicationModal.tsx`, `src/components/sync/SyncSettingsForm.tsx`, `src/components/admin/UserTable.tsx`

### Tests
`src/lib/gmail/__tests__/parsers.test.ts`, `src/lib/gmail/__tests__/matcher.test.ts`, `src/lib/gmail/__tests__/sync.test.ts`, `src/app/api/applications/__tests__/route.test.ts`, `src/app/api/auth/__tests__/auth.test.ts`, `src/app/api/admin/__tests__/users.test.ts`, `src/components/__tests__/StatusBadge.test.tsx`, `src/components/__tests__/SummaryBar.test.tsx`
