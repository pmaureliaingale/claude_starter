import { PrismaClient } from "@prisma/client";
import type { ParsedFollowUp } from "./parsers";

function normalizeCompany(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function domainMatchesCompany(domain: string, company: string): boolean {
  const normalizedDomain = domain.split(".")[0].toLowerCase();
  const normalizedCompany = normalizeCompany(company);
  return (
    normalizedCompany.includes(normalizedDomain) ||
    normalizedDomain.includes(normalizedCompany.substring(0, 6))
  );
}

export async function matchFollowUpToApplication(
  followUp: ParsedFollowUp,
  prisma: PrismaClient
): Promise<string> {
  // 1. Try Gmail thread ID first
  if (followUp.threadId) {
    const byThread = await prisma.job_application.findFirst({
      where: { gmail_thread_id: followUp.threadId },
    });
    if (byThread) return byThread.id;
  }

  // 2. Try company name (normalized)
  const allApplications = await prisma.job_application.findMany({
    select: { id: true, company: true },
  });

  const normalizedFollowUpCompany = normalizeCompany(followUp.company);

  const byCompany = allApplications.find(
    (app) => normalizeCompany(app.company) === normalizedFollowUpCompany
  );
  if (byCompany) return byCompany.id;

  // 3. Try sender domain against company names
  if (followUp.senderDomain) {
    const byDomain = allApplications.find((app) =>
      domainMatchesCompany(followUp.senderDomain, app.company)
    );
    if (byDomain) return byDomain.id;
  }

  // 4. No match — create a manual_review application
  const unmatched = await prisma.job_application.create({
    data: {
      company: followUp.company || "Unknown Company",
      job_title: "Unknown Position",
      date_applied: followUp.receivedAt,
      source: "gmail",
      status: "manual_review",
      gmail_thread_id: followUp.threadId || null,
    },
  });

  return unmatched.id;
}
