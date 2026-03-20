import { getGmailClient, isGmailConfigured } from "./client";
import { parseApplicationEmail, parseFollowUpEmail } from "./parsers";
import { matchFollowUpToApplication } from "./matcher";
import { setTokenExpired } from "./tokenStatus";
import { fetchAllLinkedInApplications, isLinkedInConfigured } from "@/lib/linkedin/scraper";
import { prisma } from "@/lib/prisma";
import type { gmail_v1 } from "googleapis";

export interface SyncResult {
  status: "success" | "failed" | "skipped";
  newApplications: number;
  newFollowUps: number;
  linkedinApplications: number;
  error?: string;
}

async function getLastSyncDate(): Promise<Date | null> {
  const lastSuccess = await prisma.sync_log.findFirst({
    where: { status: "success" },
    orderBy: { synced_at: "desc" },
  });
  return lastSuccess?.synced_at ?? null;
}

// Fetches ALL message IDs for a query, paginating through nextPageToken
async function fetchAllMessageIds(
  gmail: gmail_v1.Gmail,
  userId: string,
  query: string
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const response = await gmail.users.messages.list({
      userId,
      q: query,
      maxResults: 500,
      ...(pageToken ? { pageToken } : {}),
    });

    const messages = response.data.messages ?? [];
    for (const msg of messages) {
      if (msg.id) ids.push(msg.id);
    }

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return ids;
}

function buildAfterClause(afterDate: Date | null): string {
  return afterDate ? ` after:${Math.floor(afterDate.getTime() / 1000)}` : "";
}

export async function runGmailSync(): Promise<SyncResult> {
  if (!isGmailConfigured()) {
    return {
      status: "skipped",
      newApplications: 0,
      newFollowUps: 0,
      error: "Gmail credentials not configured",
    };
  }

  let newApplications = 0;
  let newFollowUps = 0;
  let linkedinApplications = 0;

  try {
    // --- Sync LinkedIn applications ---
    if (isLinkedInConfigured()) {
      try {
        const linkedInApps = await fetchAllLinkedInApplications();

        for (const app of linkedInApps) {
          // Deduplicate by job URL (linkedin job ID) or company+title+date combo
          const existing = await prisma.job_application.findFirst({
            where: {
              OR: [
                ...(app.jobUrl ? [{ job_url: app.jobUrl }] : []),
                {
                  company: app.company,
                  job_title: app.jobTitle,
                  source: "linkedin",
                  date_applied: {
                    gte: new Date(app.dateApplied.getTime() - 86400000),
                    lte: new Date(app.dateApplied.getTime() + 86400000),
                  },
                },
              ],
            },
          });

          if (existing) continue;

          await prisma.job_application.create({
            data: {
              company: app.company,
              job_title: app.jobTitle,
              date_applied: app.dateApplied,
              source: "linkedin",
              status: app.linkedinStatus,
              job_url: app.jobUrl,
            },
          });

          linkedinApplications++;
        }
      } catch (linkedInErr) {
        // LinkedIn sync failure is non-fatal — log and continue with Gmail sync
        console.error("[Sync] LinkedIn sync failed:", (linkedInErr as Error).message);
      }
    }

    const gmail = getGmailClient();
    const userId = process.env.GMAIL_USER ?? "me";
    const lastSync = await getLastSyncDate();
    const afterClause = buildAfterClause(lastSync);

    // --- Sync application emails ---
    // Subject query uses afterClause to only fetch new emails.
    // label:Applications has NO date filter — always scans the full label
    // so any previously missed emails are always caught.
    const appQueries = [
      `subject:"your application was sent to"${afterClause}`,
      `label:Applications`,
    ];

    // Collect unique message IDs across all queries
    const appMessageIdSet = new Set<string>();
    for (const query of appQueries) {
      const ids = await fetchAllMessageIds(gmail, userId, query);
      ids.forEach((id) => appMessageIdSet.add(id));
    }

    for (const msgId of appMessageIdSet) {
      // Skip if already imported
      const existing = await prisma.job_application.findUnique({
        where: { gmail_message_id: msgId },
      });
      if (existing) continue;

      const message = await gmail.users.messages.get({
        userId,
        id: msgId,
        format: "full",
      });

      const parsed = parseApplicationEmail(message.data);
      if (!parsed) continue;

      await prisma.job_application.create({
        data: {
          company: parsed.company,
          job_title: parsed.jobTitle,
          date_applied: parsed.dateApplied,
          source: parsed.source,
          status: "applied",
          job_url: parsed.jobUrl,
          gmail_thread_id: parsed.threadId || null,
          gmail_message_id: parsed.gmailMessageId,
        },
      });

      newApplications++;
    }

    // --- Sync follow-up emails ---
    const followUpQueries = [
      `subject:"Thank you for applying to"${afterClause}`,
      `from:no-reply subject:"applying"${afterClause}`,
    ];

    const followUpMessageIdSet = new Set<string>();
    for (const query of followUpQueries) {
      const ids = await fetchAllMessageIds(gmail, userId, query);
      ids.forEach((id) => followUpMessageIdSet.add(id));
    }

    for (const msgId of followUpMessageIdSet) {
      // Skip if already imported
      const existing = await prisma.follow_up.findUnique({
        where: { gmail_message_id: msgId },
      });
      if (existing) continue;

      const message = await gmail.users.messages.get({
        userId,
        id: msgId,
        format: "full",
      });

      const parsed = parseFollowUpEmail(message.data);
      if (!parsed) continue;

      const applicationId = await matchFollowUpToApplication(parsed, prisma);

      await prisma.follow_up.create({
        data: {
          job_application_id: applicationId,
          email_subject: parsed.emailSubject,
          email_body: parsed.emailBody,
          received_at: parsed.receivedAt,
          source: "gmail",
          gmail_message_id: parsed.gmailMessageId,
        },
      });

      newFollowUps++;
    }

    // Log success
    await prisma.sync_log.create({
      data: {
        status: "success",
        new_applications: newApplications,
        new_follow_ups: newFollowUps,
      },
    });

    setTokenExpired(false);

    return { status: "success", newApplications, newFollowUps, linkedinApplications };
  } catch (err) {
    const error = err as Error & { code?: number; message?: string };
    const errorMessage = error.message ?? "Unknown error";

    if (
      error.code === 401 ||
      errorMessage.includes("invalid_grant") ||
      errorMessage.includes("Token has been expired")
    ) {
      setTokenExpired(true);
    }

    await prisma.sync_log.create({
      data: {
        status: "failed",
        new_applications: 0,
        new_follow_ups: 0,
        error_message: errorMessage,
      },
    });

    return {
      status: "failed",
      newApplications: 0,
      newFollowUps: 0,
      linkedinApplications: 0,
      error: errorMessage,
    };
  }
}
