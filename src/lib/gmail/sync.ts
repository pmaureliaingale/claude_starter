import { getGmailClient, isGmailConfigured } from "./client";
import { parseApplicationEmail, parseFollowUpEmail } from "./parsers";
import { matchFollowUpToApplication } from "./matcher";
import { setTokenExpired } from "./tokenStatus";
import { prisma } from "@/lib/prisma";
import type { gmail_v1 } from "googleapis";

export interface SyncResult {
  status: "success" | "failed" | "skipped";
  newApplications: number;
  newFollowUps: number;
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

  try {
    const gmail = getGmailClient();
    const userId = process.env.GMAIL_USER ?? "me";
    const lastSync = await getLastSyncDate();
    const afterClause = buildAfterClause(lastSync);

    // --- Sync application emails ---
    // label:Applications has NO date filter — always scans full label to catch missed emails.
    // Subject queries are date-filtered for efficiency.
    // IDs from the label bypass subject pattern matching (user manually tagged them).
    const subjectQueries = [
      `subject:"your application was sent to"${afterClause}`,
      `subject:"you applied to"${afterClause}`,
      `subject:"application submitted"${afterClause}`,
      `subject:"application received"${afterClause}`,
      `subject:"we received your application"${afterClause}`,
      `subject:"thanks for applying"${afterClause}`,
    ];

    const appMessageIdSet = new Set<string>();
    const labelMessageIdSet = new Set<string>();

    for (const query of subjectQueries) {
      const ids = await fetchAllMessageIds(gmail, userId, query);
      ids.forEach((id) => appMessageIdSet.add(id));
    }

    const labelIds = await fetchAllMessageIds(gmail, userId, "label:Applications");
    labelIds.forEach((id) => labelMessageIdSet.add(id));

    // Merge: label IDs take precedence (no subject filter needed)
    const allAppIds = new Map<string, { fromLabel: boolean }>();
    appMessageIdSet.forEach((id) => allAppIds.set(id, { fromLabel: false }));
    labelMessageIdSet.forEach((id) => allAppIds.set(id, { fromLabel: true }));

    for (const [msgId, { fromLabel }] of allAppIds) {
      const existing = await prisma.job_application.findUnique({
        where: { gmail_message_id: msgId },
      });
      if (existing) continue;

      const message = await gmail.users.messages.get({
        userId,
        id: msgId,
        format: "full",
      });

      const parsed = parseApplicationEmail(message.data, { requireSubjectMatch: !fromLabel });
      if (!parsed) continue;

      // Secondary dedup: same company + job title + date (±1 day) already exists.
      // Only run when company is known — "Unknown Company" is too generic to dedup on.
      const dateApplied = parsed.dateApplied;
      if (parsed.company !== "Unknown Company") {
        const duplicate = await prisma.job_application.findFirst({
          where: {
            company: parsed.company,
            job_title: parsed.jobTitle,
            date_applied: {
              gte: new Date(dateApplied.getTime() - 86400000),
              lte: new Date(dateApplied.getTime() + 86400000),
            },
          },
        });
        if (duplicate) continue;
      }

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

    await prisma.sync_log.create({
      data: {
        status: "success",
        new_applications: newApplications,
        new_follow_ups: newFollowUps,
      },
    });

    setTokenExpired(false);

    return { status: "success", newApplications, newFollowUps };
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
      error: errorMessage,
    };
  }
}
