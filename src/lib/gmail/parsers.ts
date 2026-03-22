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

// Always reject — these are never application confirmations regardless of source
const HARD_REJECT_PATTERNS = [
  /^Re:/i,
  /^RE:/i,
  /^Fwd:/i,
  /^FW:/i,
  /^Automatic reply/i,
  /^Interview with/i,
  /^Next steps for your application/i,
  /^News about your application/i,
  /^Update on your application/i,
  /^Application update/i,
];

// Only reject when email comes from a subject query (not user-labeled).
// "Thank you for applying" etc. are valid ATS confirmations — if the user labeled
// the email as Applications, trust their judgment and let it through.
const SOFT_REJECT_PATTERNS = [
  /^Thank you for applying/i,
  /^Thanks for applying/i,
  /^Thank you for your application/i,
  /^Thank you for your interest/i,
  /^We received your application/i,
  /^Your application has been received/i,
];

function decodeBase64(encoded: string): string {
  try {
    return Buffer.from(encoded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/\s+/g, " ")
    .trim();
}

function extractRawHtml(payload: gmail_v1.Schema$MessagePart | undefined, depth = 0): string {
  if (!payload || depth > 5) return "";

  if (payload.body?.data && payload.mimeType === "text/html") {
    return decodeBase64(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType?.startsWith("multipart/")) {
        const result = extractRawHtml(part, depth + 1);
        if (result) return result;
      }
    }
  }

  return "";
}

function extractEmailBody(payload: gmail_v1.Schema$MessagePart | undefined, depth = 0): string {
  if (!payload || depth > 5) return "";

  if (payload.body?.data) {
    const text = decodeBase64(payload.body.data);
    if (payload.mimeType === "text/html") {
      return decodeHtmlEntities(text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " "));
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
        const html = decodeBase64(part.body.data);
        return decodeHtmlEntities(html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " "));
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

const JOB_TITLE_WORDS = /\b(?:VP|SVP|EVP|Director|Manager|Engineer|CTO|CIO|CPO|COO|CEO|Head|Lead|Principal|Senior|Staff|Officer|President|Executive|Architect|Analyst|Developer|Specialist|Coordinator|Consultant|Associate|Chief)\b/i;

function extractCompanyFromSubject(subject: string): string {
  const patterns = [
    // Explicit application confirmation patterns (highest confidence)
    /sent to (.+?)(?:\.|$)/i,
    /applied to (.+?)(?:\.|$)/i,
    /applying to (.+?)(?:\.|$)/i,
    /application to (.+?)(?:\s+[-–]|\.|$)/i,
    /application (?:submitted|received) (?:for .+? )?at (.+?)(?:\.|$)/i,
    /you applied .+? at (.+?)(?:\.|$)/i,
    // "Your Application with [Company] [Job Title]" (Workday)
    /your application with (.+?)\s+(?=VP\b|SVP\b|EVP\b|Director\b|Manager\b|Engineer\b|CTO\b|CIO\b|CPO\b|COO\b|CEO\b|Head\b|Lead\b|Principal\b|Senior\b|Staff\b|Officer\b|President\b|Executive\b|Architect\b|Analyst\b|Developer\b|Chief\b)/i,
    // "[Company] - [Job Title]" or "[Company]: [Job Title]" where second part has job title words
    /^(.+?)\s*[-–:]\s*.+/i,
    // "[Job Title] @ [Company]"
    /(?:.+?)\s*@\s*(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match) {
      const candidate = match[1].trim();
      // Reject if too long (likely grabbed the whole subject) or contains a job title word itself
      if (candidate.length > 0 && candidate.length < 60 && !JOB_TITLE_WORDS.test(candidate)) {
        return candidate;
      }
    }
  }

  return "";
}

function extractJobTitleFromSubject(subject: string): string {
  // Strip personal name prefix — "Pablo, your application..." → "your application..."
  const cleaned = subject.replace(/^[A-Z][a-z]+,\s*/i, "");

  const patterns = [
    // "applied for VP of Engineering at Company" / "applied for the VP of Engineering role"
    /applied (?:for|to) the (.+?) (?:position|role|job)/i,
    /applied for (.+?) at /i,
    /you applied (?:for|to) (.+?) at /i,
    // "your application for VP of Engineering was sent to..."
    /your application for (.+?) (?:was|has been|is)/i,
    // "application for VP of Engineering at Company" / "application for: VP of Engineering"
    /application for[:\s]+(.+?)(?:\s+at\s+|\s*[-–|]\s*|\.|$)/i,
    // "application submitted for VP of Engineering"
    /application (?:submitted|received) for (.+?)(?:\s+at\s+|\.|$)/i,
    // "we received your application for VP of Engineering"
    /received your application for (.+?)(?:\s+at\s+|\.|$)/i,
    // "Your Application with Synchrony SVP, Technology Leader..." (Workday)
    /your application with \S[\w\s,.&']+?\s+((?:VP|SVP|EVP|Director|Manager|CTO|CIO|CPO|COO|CEO|Head|Lead|Principal|Senior|Staff|Officer|President|Executive|Architect|Analyst|Developer|Chief)\b.+)$/i,
    // "[Job Title] @ [Company]" (Indeed/job board notifications)
    /^(.+?)\s*@\s*\S/i,
    // "[Company] - [Job Title]" or "[Company]: [Job Title]"
    /^[^-–:@]+[-–:]\s*(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const title = match[1].trim();
      // Sanity check: reject if too long (likely grabbed too much) or looks like a company name sentence
      if (title.length > 0 && title.length < 80 && !/^(the|a|an)\s/i.test(title)) {
        return title;
      }
    }
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

function extractJobTitleFromHtml(html: string): string {
  // Strip style/script blocks first to prevent CSS content from matching
  const cleaned = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  // ATS table format: <td>Job Title</td><td>Senior Engineer</td>
  // Works for Greenhouse, iCIMS, Workday, Lever, Taleo, and others
  const tablePatterns = [
    /<td[^>]*>\s*(?:job\s*title|position(?: title)?|role|opening)\s*<\/td>\s*<td[^>]*>\s*([^<]+?)\s*<\/td>/i,
    /<th[^>]*>\s*(?:job\s*title|position(?: title)?|role|opening)\s*<\/th>\s*<td[^>]*>\s*([^<]+?)\s*<\/td>/i,
    // Label: Value in a definition list or span
    /<(?:dt|strong|b|label)[^>]*>\s*(?:job\s*title|position(?: title)?|role)\s*[:]\s*<\/(?:dt|strong|b|label)>\s*<(?:dd|span|td|p)[^>]*>\s*([^<]+?)\s*</i,
    // "Position: <strong>Title</strong>" or "<strong>Position:</strong> Title"
    /(?:job title|position|role)\s*:\s*<[^>]+>\s*([^<]{3,80})\s*</i,
  ];

  for (const pattern of tablePatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const title = decodeHtmlEntities((match[1] ?? match[2] ?? "").trim());
      if (title.length > 2 && title.length < 100) return title;
    }
  }

  return "";
}

function extractJobTitleFromBody(body: string): string {
  const patterns = [
    // Labeled fields (most reliable)
    /job\s*title\s*[:\-]\s*([^\n\r|.]{3,80})/i,
    /position\s*(?:title)?\s*[:\-]\s*([^\n\r|.]{3,80})/i,
    /role\s*[:\-]\s*([^\n\r|.]{3,80})/i,
    /opening\s*[:\-]\s*([^\n\r|.]{3,80})/i,
    // Prose patterns
    /for the (?:position|role) of ([^\n\r.]{3,80}?)(?:\n|\r|\.)/i,
    /applied for (?:the )?([^\n\r.]{3,80}?)(?:\s+at\s+|\n|\r|\.)/i,
    /you(?:'ve| have) applied (?:for|to) (?:the )?([^\n\r.]{3,80}?)(?:\s+(?:position|role|opening|at)\s+|\n|\r|\.)/i,
    /application for (?:the )?([^\n\r.]{3,80}?)(?:\s+at\s+|\n|\r|\.)/i,
    /submitted (?:your )?application for (?:the )?([^\n\r.]{3,80}?)(?:\s+at\s+|\n|\r|\.)/i,
    /received (?:your )?application for (?:the )?([^\n\r.]{3,80}?)(?:\s+at\s+|\n|\r|\.)/i,
    /interest in the ([^\n\r.]{3,80}?) (?:position|role|opening)/i,
    /applying (?:for|to) (?:the )?([^\n\r.]{3,80}?) (?:position|role|opening)/i,
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) {
      const title = match[1].trim();
      if (title.length > 2 && title.length < 100) return title;
    }
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

    // Always reject clear non-applications (replies, forwards, interview threads, status updates)
    if (HARD_REJECT_PATTERNS.some((p) => p.test(subject))) return null;

    // For subject-query emails, also reject ambiguous subjects like "Thank you for applying"
    // (could be a follow-up acknowledgment). Label-sourced emails skip this — user labeled them.
    if (requireSubjectMatch && SOFT_REJECT_PATTERNS.some((p) => p.test(subject))) return null;

    // For label-sourced emails, skip the positive subject match requirement
    if (requireSubjectMatch) {
      const isApplicationEmail = APPLICATION_SUBJECT_PATTERNS.some((p) => p.test(subject));
      if (!isApplicationEmail) return null;
    }

    const body = extractEmailBody(message.payload);
    const rawHtml = extractRawHtml(message.payload);
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
      extractCompanyFromBody(body) ||
      "Unknown Company";

    const jobTitle =
      extractJobTitleFromSubject(subject) ||
      (rawHtml ? extractJobTitleFromHtml(rawHtml) : "") ||
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

export interface ExtractedFields {
  jobTitle: string | null;
  company: string | null;
}

/**
 * Extracts job title and company from a Gmail message without any subject filtering.
 * Used for re-parsing existing applications — skips all accept/reject pattern checks
 * since we already know the record is a valid application.
 */
export function extractFieldsFromMessage(message: gmail_v1.Schema$Message): ExtractedFields {
  try {
    const headers = message.payload?.headers ?? [];
    const subject = getHeader(headers, "subject");

    const body = extractEmailBody(message.payload);
    const rawHtml = extractRawHtml(message.payload);

    // Indeed special-case: "Indeed Application: Job Title"
    const indeedMatch = subject.match(/^indeed application:\s*(.+)/i);
    if (indeedMatch) {
      return {
        jobTitle: indeedMatch[1].trim(),
        company: extractCompanyFromBody(body) || null,
      };
    }

    const jobTitle =
      extractJobTitleFromSubject(subject) ||
      (rawHtml ? extractJobTitleFromHtml(rawHtml) : "") ||
      extractJobTitleFromBody(body) ||
      null;

    const company =
      extractCompanyFromSubject(subject) ||
      extractCompanyFromBody(body) ||
      null;

    return { jobTitle, company };
  } catch {
    return { jobTitle: null, company: null };
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
