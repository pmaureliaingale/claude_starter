# New Job Helper

A personal job search tracker that aggregates applications from LinkedIn, Gmail, and other job sites into a single dashboard with filtering, stats, and CSV export.

## Commands

```bash
docker compose up --build   # Start development / local server
docker compose build        # Production build
npm run test                # Run test suite
npm run lint                # Lint / format
```

## Stack

- **Language**: TypeScript
- **Framework**: Next.js (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: None (single-user local app)
- **Deployment**: Docker Compose (local)

## Architecture

- Next.js App Router handles both the dashboard UI (`app/`) and API routes (`app/api/`)
- Prisma schema lives in `prisma/schema.prisma` — run `npx prisma migrate dev` after schema changes
- Gmail integration uses the Google Gmail API to parse application confirmation emails (subject: "Pablo, your application was sent to...")
- Job sources: LinkedIn (via Gmail parsing), with hired.cafe, builtin.com, and monster.com planned for later
- Dashboard filters by source site, and aggregates stats by day/week/month/year

## Important Gotchas

- Always run `npx prisma migrate dev` after changing `prisma/schema.prisma`
- Gmail API requires OAuth2 credentials — store in `.env` as `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`
- Never commit `.env` — it contains Gmail OAuth tokens
- Docker Compose runs both the Next.js app and PostgreSQL — use `docker compose up` to start both together

## Required Engineering Standards

**All new features and enhancements MUST include tests. See `.claude/rules/testing.md` for details.**

Every page designed MUST have a responsive design for mobile use.

**Check the docker logs after implementing any new feature or enhancement.**

**NEVER commit changes unless the user explicitly asks you to.**

If migrations are created, run them when complete.

**ALWAYS use the `frontend-design` skill when making or editing the UI.**

When creating new pages that are not full width, center the page — do not hug the left.

Standardize patterns by creating reusable components. If logic is likely to be repeated, create a new component. We do not want duplicate code.

**Data Model Rules**
- Table names MUST be singular (e.g. `user`, `user_token`)
- Every table MUST have `created_at` and `updated_at` timestamp fields

> Add your own project standards below as your team develops conventions.

## Rules

See `.claude/rules/` for detailed standards:

- @.claude/rules/code-style.md
- @.claude/rules/git-workflow.md
- @.claude/rules/testing.md
- @.claude/rules/security.md
