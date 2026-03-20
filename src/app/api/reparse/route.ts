import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGmailClient } from "@/lib/gmail/client";
import { extractFieldsFromMessage } from "@/lib/gmail/parsers";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gmail = getGmailClient();

  // Only re-parse records imported from Gmail (have a real message ID)
  const applications = await prisma.job_application.findMany({
    where: { gmail_message_id: { not: "" } },
    select: { id: true, gmail_message_id: true, job_title: true, company: true },
  });

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const app of applications) {
    try {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: app.gmail_message_id,
        format: "full",
      });

      const { jobTitle, company } = extractFieldsFromMessage(msg.data);

      const titleChanged =
        jobTitle && jobTitle !== "Unknown Position" && jobTitle !== app.job_title;
      const companyChanged =
        company && company !== "Unknown Company" && company !== app.company;

      if (!titleChanged && !companyChanged) {
        skipped++;
        continue;
      }

      await prisma.job_application.update({
        where: { id: app.id },
        data: {
          ...(titleChanged ? { job_title: jobTitle } : {}),
          ...(companyChanged ? { company } : {}),
        },
      });

      updated++;
    } catch {
      errors++;
    }
  }

  return NextResponse.json({ total: applications.length, updated, skipped, errors });
}
