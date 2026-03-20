# Feature: Job Search Tracker

> **Status**: Ready
> **Spec file**: `.claude/specs/job-search-tracker.md`

## Problem
Tracking job applications across multiple platforms (LinkedIn, Gmail, hired.cafe, builtin.com, monster.com) is fragmented and manual. There is no single place to see all applications, monitor responses, or understand search activity over time.

## Users & Roles
| Role | Can Do | Cannot Do |
|------|--------|-----------|
| Admin (Pablo) | View dashboard, filter/export applications, manage sync settings, add/remove users | N/A — full access |
| Viewer (future) | View dashboard, filter/export applications | Manage sync settings, manage users |

## User Stories
- As a **user**, I want to see a dashboard of all my job applications so I can get a quick overview of my search activity.
- As a **user**, I want to filter applications by source (LinkedIn, Gmail, etc.) so I can see how each platform is performing.
- As a **user**, I want to see application counts broken down by day, week, month, and year so I can track my activity over time.
- As a **user**, I want to export my applications to CSV filtered by time period so I can analyze them outside the app.
- As a **user**, I want the app to automatically sync new applications from Gmail so I don't have to enter them manually.
- As a **user**, I want to see follow-up emails from companies linked under the original application so I can track the full communication history in one place.
- As a **user**, I want to control how often Gmail syncs (with a manual "Sync Now" option) so I can balance freshness with performance.
- As an **admin**, I want to add and manage users so the app can be shared if needed in the future.

## Acceptance Criteria
- [ ] Dashboard loads with a summary bar at the top (total applications, response rate, applications by status)
- [ ] Response rate is calculated per company: (companies with at least one follow-up) / (total companies applied to) × 100. Companies with no follow-up count as 0%
- [ ] Applications are listed below the summary with company, job title, date applied, source, and status
- [ ] Filtering by source (LinkedIn, Gmail, etc.) updates the dashboard in real time
- [ ] Stats (application counts) can be toggled by day, week, month, and year
- [ ] Clicking an application opens a side modal showing full job details and any follow-ups beneath it
- [ ] User can manually update the status of any application from the side modal (applied, responded, interviewing, offer, rejected, withdrawn)
- [ ] Gmail sync runs automatically on a user-configured schedule (default: every 3 hours, 8 AM–5 PM local time)
- [ ] Any user (admin or viewer) can trigger an immediate sync via the "Sync Now" button
- [ ] Sync settings page allows the user to configure frequency, start time, end time, and timezone
- [ ] New applications parsed from Gmail emails with subject "Pablo, your application was sent to..." are added without duplicates
- [ ] Follow-up emails are identified by: subject containing "Thank you for applying to..." AND sender from a no-reply@ address
- [ ] Follow-up emails are matched to an existing application by: (1) company name in email body/subject, (2) sender domain matched against known company domain, (3) Gmail thread ID if available
- [ ] Matched follow-ups are linked to the original application and displayed in the side modal
- [ ] Unmatched emails (cannot be linked to any application) are flagged as "Manual Review" status
- [ ] Duplicate applications (same job from multiple sources) are shown separately with their source clearly labeled
- [ ] Failed syncs display an error notification; retry happens at the next scheduled sync time
- [ ] When a Gmail OAuth token expires, an in-app alert notifies the user to re-authenticate
- [ ] When no applications exist for a selected date range, the message "No Applications on [date]" is shown
- [ ] CSV export includes: Company, Job Title, Date Applied, Source — filtered by the selected time period
- [ ] Admin panel allows adding and removing users with username, email, password, and role
- [ ] `/admin` route is accessible only to users with role = admin
- [ ] All pages are mobile-responsive

## Out of Scope
- Integration with hired.cafe, builtin.com, and monster.com (planned for a future phase)
- Automated job recommendations or job searching
- Resume or cover letter storage
- Interview scheduling or calendar integration
- Mobile app (web only)
- Email composition or replying to companies from within the app

## Data Model Changes

### New Tables

**`job_application`**
```
id               UUID PRIMARY KEY
company          TEXT NOT NULL
job_title        TEXT NOT NULL
date_applied     TIMESTAMP NOT NULL
source           TEXT NOT NULL  -- 'linkedin', 'gmail', 'builtin', 'monster', etc.
status           TEXT NOT NULL  -- 'applied', 'responded', 'interviewing', 'offer', 'rejected', 'withdrawn', 'manual_review'
job_url          TEXT
created_at       TIMESTAMP NOT NULL DEFAULT NOW()
updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
```

**`follow_up`**
```
id                   UUID PRIMARY KEY
job_application_id   UUID NOT NULL REFERENCES job_application(id)
email_subject        TEXT NOT NULL
email_body           TEXT NOT NULL
received_at          TIMESTAMP NOT NULL
source               TEXT NOT NULL  -- 'gmail'
created_at           TIMESTAMP NOT NULL DEFAULT NOW()
updated_at           TIMESTAMP NOT NULL DEFAULT NOW()
```

**`sync_log`**
```
id                   UUID PRIMARY KEY
synced_at            TIMESTAMP NOT NULL
status               TEXT NOT NULL  -- 'success', 'failed'
new_applications     INT NOT NULL DEFAULT 0
error_message        TEXT
created_at           TIMESTAMP NOT NULL DEFAULT NOW()
updated_at           TIMESTAMP NOT NULL DEFAULT NOW()
```

**`sync_schedule`**
```
id             UUID PRIMARY KEY
frequency_hrs  INT NOT NULL DEFAULT 3
start_time     TIME NOT NULL DEFAULT '08:00'
end_time       TIME NOT NULL DEFAULT '17:00'
timezone       TEXT NOT NULL DEFAULT 'America/Chicago'
created_at     TIMESTAMP NOT NULL DEFAULT NOW()
updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
```

**`user`**
```
id             UUID PRIMARY KEY
username       TEXT NOT NULL UNIQUE
email          TEXT NOT NULL UNIQUE
password_hash  TEXT NOT NULL
role           TEXT NOT NULL DEFAULT 'viewer'  -- 'admin', 'viewer'
created_at     TIMESTAMP NOT NULL DEFAULT NOW()
updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
```

## UI / UX Notes

**Pages:**
- `/` — Dashboard (summary + application list with filters)
- `/sync-settings` — Configure Gmail sync schedule and trigger manual sync
- `/admin` — User management (admin only)

**Dashboard layout:**
- Summary bar at top: total applications, response rate, breakdown by status (applied, responded, interviewing, offer, rejected, withdrawn)
- Stats toggle: Day / Week / Month / Year
- Filter bar: filter by source site
- Application list below with company, job title, date applied, source badge, status badge

**Application detail:**
- Clicking any application opens a right-side modal
- Modal shows: company, job title, source, date applied, status, job URL, and a chronological list of follow-ups (subject, received date, full email body expandable)

**Style:**
- Modern, clean aesthetic with a vibrant but professional color palette
- Use glassmorphism or soft gradients for cards and panels
- Status badges with distinct colors per status (e.g., green for offer, blue for applied, orange for interviewing, red for rejected)
- Smooth transitions on modal open/close and filter changes

## Open Questions
- [x] What Gmail account should be used for OAuth? → pmaureliajobs@gmail.com
- [x] Should the sync schedule be global or per-user? → Global (one schedule for all users)
- [x] Should "Manual Review" items appear on the main dashboard? → Yes, flagged with "Manual Review" status like any other application
- [x] Can users manually update application status? → Yes, from the side modal
- [x] How are follow-ups matched to applications? → By company name, sender domain, and Gmail thread ID
- [x] How is response rate calculated? → (companies with ≥1 follow-up) / (total companies applied to) × 100
- [x] What happens when Gmail OAuth token expires? → In-app alert prompts user to re-authenticate
- [x] Can viewers trigger manual sync? → Yes
- [x] Is /applications page needed? → No, removed — dashboard covers it
- [x] What pattern identifies follow-up emails? → Subject contains "Thank you for applying to..." AND sender is no-reply@*

## Notes
- Gmail integration requires Google OAuth2 credentials stored in `.env` as `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`
- Gmail account: pmaureliajobs@gmail.com
- LinkedIn application emails follow the subject pattern: "Pablo, your application was sent to..."
- Follow-up emails follow the pattern: subject contains "Thank you for applying to..." AND sender is no-reply@*
- Follow-up matching priority: (1) Gmail thread ID, (2) company name in subject/body, (3) sender domain vs. known company domain
- The sync scheduler should use a background job (e.g., node-cron inside the Next.js server) running within the Docker container
- node-cron works reliably in local Docker (always-on) — do NOT deploy this to serverless platforms like Vercel without replacing the scheduler
- Prisma migrations required for all new tables — run `npx prisma migrate dev` after schema changes
- `/admin` route must check session role server-side before rendering — never rely on client-side role state
