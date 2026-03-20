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

// Maps sender domains (and subdomains) to source labels
const SOURCE_DOMAIN_MAP: Record<string, string> = {
  "linkedin.com": "linkedin",
  "joinalerts.linkedin.com": "linkedin",
  "notifications.linkedin.com": "linkedin",
  "builtin.com": "builtin",
  "builtinboston.com": "builtin",
  "builtinnyc.com": "builtin",
  "builtinchicago.com": "builtin",
  "builtinaustin.com": "builtin",
  "builtinla.com": "builtin",
  "builtinseattle.com": "builtin",
  "builtincolorado.com": "builtin",
  "monster.com": "monster",
  "hired.cafe": "hired.cafe",
  "indeed.com": "indeed",
  "glassdoor.com": "glassdoor",
  "ziprecruiter.com": "ziprecruiter",
  "wellfound.com": "wellfound",
  "angel.co": "wellfound",
  "dice.com": "dice",
  "simplyhired.com": "simplyhired",
  "careerbuilder.com": "careerbuilder",
  "lever.co": "lever",
  "greenhouse.io": "greenhouse",
  "workday.com": "workday",
  "icims.com": "icims",
};

// Subject patterns that indicate a job application confirmation
const APPLICATION_SUBJECT_PATTERNS = [
  /your application was sent to/i,
  /you applied to/i,
  /application submitted/i,
  /application received/i,
  /we received your application/i,
  /thanks for applying/i,
  /thank you for applying/i,
  /your application to/i,
  /applied for .+ at /i,
  /^indeed application:/i,
];

// Subjects to always reject — replies, threads, follow-ups, non-applications
const LABEL_REJECT_PATTERNS = [
  /^Re:/i,
  /^RE:/i,
  /^Fwd:/i,
  /^FW:/i,
  /^Automatic reply/i,
  /^Interview with/i,
  /^Next steps for your application/i,
  /^News about your application/i,
  /^Thank you for applying/i,
  /^Thanks for applying/i,
  /^Thank You For Applying/i,
  /^Thank you for your application/i,
  /^Thank You for Your Application/i,
  /^Thank you for your interest/i,
  /^Thank You for Your Interest/i,
  /^We received your application/i,
  /^Your application has been received/i,
  /^Update on your application/i,
  /^Application update/i,
];

function decodeBase64(encoded: string): string {
  try {
    return Buffer.from(encoded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function extractEmailBody(payload: gmail_v1.Schema$MessagePart | undefined, depth = 0): string {
  if (!payload || depth > 5) return "";

  if (payload.body?.data) {
    const text = decodeBase64(payload.body.data);
    if (payload.mimeType === "text/html") {
      return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    return text;
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType?.startsWith("multipart/")) {
        const result = extractEmailBody(part, depth + 1);
        if (result) return result;
      }
    }
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

function extractSenderDomain(from: string): string {
  const emailMatch = from.match(/@([^>]+)>?$/);
  if (emailMatch) return emailMatch[1].toLowerCase().trim();
  return "";
}

function detectSource(from: string, body: string): string {
  const domain = extractSenderDomain(from);

  // Exact match
  if (SOURCE_DOMAIN_MAP[domain]) return SOURCE_DOMAIN_MAP[domain];

  // Subdomain match — e.g. mail.linkedin.com → linkedin.com
  for (const [key, value] of Object.entries(SOURCE_DOMAIN_MAP)) {
    if (domain === key || domain.endsWith(`.${key}`)) return value;
  }

  // Fallback: scan body for known job board URLs
  for (const [key, value] of Object.entries(SOURCE_DOMAIN_MAP)) {
    if (body.toLowerCase().includes(key)) return value;
  }

  return "other";
}

function extractCompanyFromSubject(subject: string): string {
  const patterns = [
    /sent to (.+?)(?:\.|$)/i,
    /applied to (.+?)(?:\.|$)/i,
    /applying to (.+?)(?:\.|$)/i,
    /application to (.+?)(?:\s+[-–]|\.|$)/i,
    /application (?:submitted|received) (?:for .+? )?at (.+?)(?:\.|$)/i,
    /you applied .+? at (.+?)(?:\.|$)/i,
  ];

  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match) return match[1].trim();
  }

  return "";
}

function extractJobTitleFromSubject(subject: string): string {
  const patterns = [
    /applied (?:for|to) the (.+?) (?:position|role|job)/i,
    /application for (.+?) at /i,
    /you applied for (.+?) at /i,
  ];

  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match) return match[1].trim();
  }

  return "";
}

function extractCompanyFromBody(body: string): string {
  const patterns = [
    /at (.+?)(?:\.|,|\n|\r)/i,
    /with (.+?)(?:\.|,|\n|\r)/i,
    /company:\s*(.+?)(?:\n|\r|\.)/i,
    /employer:\s*(.+?)(?:\n|\r|\.)/i,
  ];
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) return match[1].trim();
  }
  return "";
}

function extractJobTitleFromBody(body: string): string {
  const patterns = [
    /for the position of (.+?)(?:\n|\r|\.)/i,
    /for the role of (.+?)(?:\n|\r|\.)/i,
    /applied for (.+?)(?:\n|\r|\.| at )/i,
    /position:\s*(.+?)(?:\n|\r|\.)/i,
    /job title:\s*(.+?)(?:\n|\r|\.)/i,
    /role:\s*(.+?)(?:\n|\r|\.)/i,
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) return match[1].trim();
  }

  return "";
}

function extractJobUrl(body: string, source: string): string | null {
  // Try source-specific URL patterns first
  const sourcePatterns: Record<string, RegExp> = {
    linkedin: /https?:\/\/(?:www\.)?linkedin\.com\/jobs\/view\/[^\s"<>]+/i,
    builtin: /https?:\/\/(?:www\.)?builtin(?:boston|nyc|chicago|austin|la|seattle|colorado)?\.com\/job\/[^\s"<>]+/i,
    indeed: /https?:\/\/(?:www\.)?indeed\.com\/viewjob[^\s"<>]+/i,
    glassdoor: /https?:\/\/(?:www\.)?glassdoor\.com\/job-listing\/[^\s"<>]+/i,
    ziprecruiter: /https?:\/\/(?:www\.)?ziprecruiter\.com\/c\/[^\s"<>]+/i,
  };

  if (sourcePatterns[source]) {
    const match = body.match(sourcePatterns[source]);
    if (match) return match[0];
  }

  // Generic fallback: any job-related URL
  const generic = body.match(/https?:\/\/[^\s"<>]+\/jobs?\/[^\s"<>]+/i);
  return generic ? generic[0] : null;
}

function isNoReplyAddress(from: string): boolean {
  return /no.?reply@/i.test(from);
}

export function parseApplicationEmail(
  message: gmail_v1.Schema$Message,
  { requireSubjectMatch = true }: { requireSubjectMatch?: boolean } = {}
): ParsedApplication | null {
  try {
    const headers = message.payload?.headers ?? [];
    const subject = getHeader(headers, "subject");
    const from = getHeader(headers, "from");
    const dateStr = getHeader(headers, "date");

    // Always reject obvious non-application subjects (replies, forwards, interview threads)
    if (LABEL_REJECT_PATTERNS.some((p) => p.test(subject))) return null;

    // For label-sourced emails, skip the positive subject match requirement
    if (requireSubjectMatch) {
      const isApplicationEmail = APPLICATION_SUBJECT_PATTERNS.some((p) => p.test(subject));
      if (!isApplicationEmail) return null;
    }

    const body = extractEmailBody(message.payload);
    const source = detectSource(from, body);

    // Handle "Indeed Application: Job Title" format
    const indeedMatch = subject.match(/^indeed application:\s*(.+)/i);
    if (indeedMatch) {
      const jobTitle = indeedMatch[1].trim();
      const company = extractJobTitleFromBody(body) ? extractCompanyFromBody(body) : "Unknown Company";
      return {
        company: company || "Unknown Company",
        jobTitle,
        dateApplied: dateStr ? new Date(dateStr) : new Date(),
        source: "indeed",
        threadId: message.threadId ?? "",
        gmailMessageId: message.id ?? "",
        jobUrl: extractJobUrl(body, "indeed"),
      };
    }

    const company =
      extractCompanyFromSubject(subject) ||
      subject.replace(/.*sent to /i, "").replace(/.*applied to /i, "").trim() ||
      "Unknown Company";

    const jobTitle =
      extractJobTitleFromSubject(subject) ||
      extractJobTitleFromBody(body) ||
      "Unknown Position";

    const jobUrl = extractJobUrl(body, source);
    const dateApplied = dateStr ? new Date(dateStr) : new Date();

    return {
      company,
      jobTitle,
      dateApplied,
      source,
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
