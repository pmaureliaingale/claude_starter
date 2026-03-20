import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGmailClient, isGmailConfigured } from "@/lib/gmail/client";

function decodeBase64(encoded: string): string {
  try {
    return Buffer.from(encoded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function extractBody(payload: Record<string, unknown> | undefined, depth = 0): string {
  if (!payload || depth > 5) return "";

  const body = payload.body as Record<string, unknown> | undefined;
  if (body?.data) {
    const text = decodeBase64(body.data as string);
    if (payload.mimeType === "text/html") {
      return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    return text;
  }

  const parts = payload.parts as Record<string, unknown>[] | undefined;
  if (parts) {
    for (const part of parts) {
      if (part.mimeType === "text/plain") {
        const b = part.body as Record<string, unknown> | undefined;
        if (b?.data) return decodeBase64(b.data as string);
      }
    }
    for (const part of parts) {
      if ((part.mimeType as string)?.startsWith("multipart/")) {
        const result = extractBody(part, depth + 1);
        if (result) return result;
      }
    }
    for (const part of parts) {
      if (part.mimeType === "text/html") {
        const b = part.body as Record<string, unknown> | undefined;
        if (b?.data) {
          return decodeBase64(b.data as string).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        }
      }
    }
  }

  return "";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const application = await prisma.job_application.findUnique({
    where: { id },
    select: { gmail_message_id: true, company: true, job_title: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!application.gmail_message_id) {
    return NextResponse.json({ body: null, reason: "no_gmail_id" });
  }

  if (!isGmailConfigured()) {
    return NextResponse.json({ body: null, reason: "gmail_not_configured" });
  }

  try {
    const gmail = getGmailClient();
    const userId = process.env.GMAIL_USER ?? "me";

    const message = await gmail.users.messages.get({
      userId,
      id: application.gmail_message_id,
      format: "full",
    });

    const headers = message.data.payload?.headers ?? [];
    const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value ?? "";
    const from = headers.find((h) => h.name?.toLowerCase() === "from")?.value ?? "";
    const date = headers.find((h) => h.name?.toLowerCase() === "date")?.value ?? "";

    const body = extractBody(message.data.payload as Record<string, unknown> | undefined);

    return NextResponse.json({ body: body || null, subject, from, date });
  } catch (err) {
    console.error("[Email fetch]", err);
    return NextResponse.json({ body: null, reason: "fetch_failed" });
  }
}
