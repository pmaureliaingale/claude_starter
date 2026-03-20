import { gmail_v1 } from "googleapis";

export interface ParsedApplication {
  company: string;
  jobTitle: string;
  dateApplied: Date;
  source: string;
  threadId: string;
  gmailMessageId: string;
  jobUrl: string | null;
}

export interface ParsedFollowUp {
  company: string;
  emailSubject: string;
  emailBody: string;
  receivedAt: Date;
  senderDomain: string;
  threadId: string;
  gmailMessageId: string;
}

function decodeBase64(encoded: string): string {
  try {
    return Buffer.from(encoded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function extractEmailBody(payload: gmail_v1.Schema$MessagePart | undefined, depth = 0): string {
  if (!payload || depth > 5) return "";

  // Direct body data
  if (payload.body?.data) {
    const text = decodeBase64(payload.body.data);
    if (payload.mimeType === "text/html") {
      return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    return text;
  }

  if (payload.parts) {
    // Prefer plain text at any nesting level
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }
    // Recurse into multipart/* containers
    for (const part of payload.parts) {
      if (part.mimeType?.startsWith("multipart/")) {
        const result = extractEmailBody(part, depth + 1);
        if (result) return result;
      }
    }
    // Fallback to HTML part
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return decodeBase64(part.body.data).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }
    }
  }

  return "";
}

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function extractCompanyFromSubject(subject: string): string {
  // "Pablo, your application was sent to Company Name"
  const match = subject.match(/sent to (.+?)(?:\.|$)/i);
  if (match) return match[1].trim();

  // "Thank you for applying to Company Name"
  const match2 = subject.match(/applying to (.+?)(?:\.|$)/i);
  if (match2) return match2[1].trim();

  return "";
}

function extractJobTitleFromBody(body: string): string {
  // Common patterns in LinkedIn emails
  const patterns = [
    /for the position of (.+?)(?:\n|\r|\.)/i,
    /for the role of (.+?)(?:\n|\r|\.)/i,
    /applied for (.+?)(?:\n|\r|\.| at )/i,
    /position: (.+?)(?:\n|\r|\.)/i,
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) return match[1].trim();
  }

  return "Unknown Position";
}

function extractSenderDomain(from: string): string {
  const emailMatch = from.match(/@([^>]+)>?$/);
  if (emailMatch) return emailMatch[1].toLowerCase();
  return "";
}

function isNoReplyAddress(from: string): boolean {
  return /no.?reply@/i.test(from);
}

export function parseApplicationEmail(
  message: gmail_v1.Schema$Message
): ParsedApplication | null {
  try {
    const headers = message.payload?.headers ?? [];
    const subject = getHeader(headers, "subject");
    const dateStr = getHeader(headers, "date");

    // Must match LinkedIn application pattern
    if (!/your application was sent to/i.test(subject)) {
      return null;
    }

    const company = extractCompanyFromSubject(subject) || subject.replace(/.*sent to /i, "").trim() || "Unknown Company";

    const body = extractEmailBody(message.payload);
    const jobTitle = extractJobTitleFromBody(body);

    // Try to extract job URL
    const urlMatch = body.match(/https?:\/\/www\.linkedin\.com\/jobs\/view\/[^\s"<>]+/i);
    const jobUrl = urlMatch ? urlMatch[0] : null;

    const dateApplied = dateStr ? new Date(dateStr) : new Date();

    return {
      company,
      jobTitle,
      dateApplied,
      source: "linkedin",
      threadId: message.threadId ?? "",
      gmailMessageId: message.id ?? "",
      jobUrl,
    };
  } catch {
    return null;
  }
}

export function parseFollowUpEmail(
  message: gmail_v1.Schema$Message
): ParsedFollowUp | null {
  try {
    const headers = message.payload?.headers ?? [];
    const subject = getHeader(headers, "subject");
    const from = getHeader(headers, "from");
    const dateStr = getHeader(headers, "date");

    // Must match follow-up pattern: "Thank you for applying to" + no-reply sender
    if (!/thank you for applying to/i.test(subject)) return null;
    if (!isNoReplyAddress(from)) return null;

    const company = extractCompanyFromSubject(subject);
    if (!company) return null;

    const body = extractEmailBody(message.payload);
    const senderDomain = extractSenderDomain(from);
    const receivedAt = dateStr ? new Date(dateStr) : new Date();

    return {
      company,
      emailSubject: subject,
      emailBody: body || "(No body content)",
      receivedAt,
      senderDomain,
      threadId: message.threadId ?? "",
      gmailMessageId: message.id ?? "",
    };
  } catch {
    return null;
  }
}
