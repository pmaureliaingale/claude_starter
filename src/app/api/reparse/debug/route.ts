import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGmailClient } from "@/lib/gmail/client";
import { gmail_v1 } from "googleapis";

function decodeBase64(encoded: string): string {
  try {
    return Buffer.from(encoded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function extractPlainText(payload: gmail_v1.Schema$MessagePart | undefined, depth = 0): string {
  if (!payload || depth > 5) return "";
  if (payload.body?.data && payload.mimeType === "text/plain") return decodeBase64(payload.body.data);
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) return decodeBase64(part.body.data);
    }
    for (const part of payload.parts) {
      const r = extractPlainText(part, depth + 1);
      if (r) return r;
    }
  }
  return "";
}

function extractHtml(payload: gmail_v1.Schema$MessagePart | undefined, depth = 0): string {
  if (!payload || depth > 5) return "";
  if (payload.body?.data && payload.mimeType === "text/html") return decodeBase64(payload.body.data);
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) return decodeBase64(part.body.data);
    }
    for (const part of payload.parts) {
      const r = extractHtml(part, depth + 1);
      if (r) return r;
    }
  }
  return "";
}

// GET /api/reparse/debug?limit=5
// Returns raw email content for the first N Gmail-imported applications
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(10, parseInt(req.nextUrl.searchParams.get("limit") ?? "5", 10));
  const gmail = getGmailClient();

  const applications = await prisma.job_application.findMany({
    where: { gmail_message_id: { not: "" } },
    select: { id: true, gmail_message_id: true, job_title: true, company: true },
    take: limit,
  });

  const results = [];

  for (const app of applications) {
    try {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: app.gmail_message_id,
        format: "full",
      });

      const headers = msg.data.payload?.headers ?? [];
      const subject = getHeader(headers, "subject");
      const from = getHeader(headers, "from");
      const plainText = extractPlainText(msg.data.payload);
      const html = extractHtml(msg.data.payload);

      results.push({
        id: app.id,
        current: { job_title: app.job_title, company: app.company },
        subject,
        from,
        plainTextSnippet: plainText.slice(0, 500),
        htmlSnippet: html.slice(0, 1000),
        mimeType: msg.data.payload?.mimeType,
      });
    } catch (e) {
      results.push({ id: app.id, error: String(e) });
    }
  }

  return NextResponse.json(results, { headers: { "Content-Type": "application/json" } });
}
