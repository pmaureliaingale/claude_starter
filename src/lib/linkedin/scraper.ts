export interface LinkedInApplication {
  company: string;
  jobTitle: string;
  dateApplied: Date;
  jobUrl: string | null;
  linkedinStatus: string;
  linkedinJobId: string;
}

interface VoyagerPaging {
  count: number;
  start: number;
  total: number;
}

interface VoyagerResponse {
  elements: Record<string, unknown>[];
  paging: VoyagerPaging;
}

const PAGE_SIZE = 10;

const STATUS_MAP: Record<string, string> = {
  APPLIED: "applied",
  APPLICATION_IN_REVIEW: "responded",
  IN_PROGRESS: "interviewing",
  OFFER_EXTENDED: "offer",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
  VIEWED: "applied",
};

function getCsrfToken(): string {
  // LinkedIn requires csrf-token header to match the JSESSIONID cookie value (without surrounding quotes)
  return process.env.LINKEDIN_JSESSIONID?.replace(/^"|"$/g, "") ?? "ajax:0";
}

function extractCompanyName(element: Record<string, unknown>): string {
  try {
    const jobPosting = element.jobPosting as Record<string, unknown> | undefined;
    if (!jobPosting) return "Unknown Company";

    const companyDetails = jobPosting.companyDetails as Record<string, unknown> | undefined;
    if (!companyDetails) return "Unknown Company";

    // Try different response shapes LinkedIn has used
    const shapes = [
      "com.linkedin.voyager.jobs.JobPostingCompany",
      "com.linkedin.voyager.deco.jobs.web.shared.DecoratedJobPostingCompany",
    ];

    for (const shape of shapes) {
      const companyObj = companyDetails[shape] as Record<string, unknown> | undefined;
      if (!companyObj) continue;

      const resolution = companyObj.companyResolutionResult as Record<string, unknown> | undefined;
      if (resolution?.name) return resolution.name as string;

      const company = companyObj.company as Record<string, unknown> | undefined;
      if (company?.name) return company.name as string;
    }

    // Fallback: search for any "name" field in companyDetails
    const raw = JSON.stringify(companyDetails);
    const match = raw.match(/"name"\s*:\s*"([^"]+)"/);
    if (match) return match[1];
  } catch {
    // ignore
  }
  return "Unknown Company";
}

function extractJobTitle(element: Record<string, unknown>): string {
  try {
    const jobPosting = element.jobPosting as Record<string, unknown> | undefined;
    return (jobPosting?.title as string) ?? "Unknown Position";
  } catch {
    return "Unknown Position";
  }
}

function extractJobId(element: Record<string, unknown>): string {
  try {
    const jobPosting = element.jobPosting as Record<string, unknown> | undefined;
    const entityUrn = (jobPosting?.entityUrn ?? jobPosting?.["*jobPosting"]) as string | undefined;
    if (entityUrn) {
      const match = entityUrn.match(/(\d+)$/);
      if (match) return match[1];
    }
    return (element.jobApplicationEntityUrn as string) ?? String(Date.now());
  } catch {
    return String(Date.now());
  }
}

function extractStatus(element: Record<string, unknown>): string {
  try {
    const rawStatus = (element.jobApplicationStatus ?? element.applicationStatus) as string | undefined;
    if (rawStatus && STATUS_MAP[rawStatus]) return STATUS_MAP[rawStatus];
  } catch {
    // ignore
  }
  return "applied";
}

function extractDateApplied(element: Record<string, unknown>): Date {
  try {
    const ts = (element.appliedAt ?? element.createdAt) as number | undefined;
    if (ts) return new Date(ts);
  } catch {
    // ignore
  }
  return new Date();
}

async function fetchPage(
  liAt: string,
  start: number,
  count: number
): Promise<VoyagerResponse> {
  const baseUrl = process.env.LINKEDIN_API_URL ?? "https://www.linkedin.com/voyager/api/jobs/jobApplications";
  const url = `${baseUrl}?start=${start}&count=${count}`;

  const jsessionid = process.env.LINKEDIN_JSESSIONID?.replace(/^"|"$/g, "");
  const cookieHeader = jsessionid
    ? `li_at=${liAt}; JSESSIONID="${jsessionid}"`
    : `li_at=${liAt}`;

  console.error("[LinkedIn] Fetching:", url);

  const response = await fetch(url, {
    headers: {
      Cookie: cookieHeader,
      "csrf-token": getCsrfToken(),
      "x-restli-protocol-version": "2.0.0",
      "x-li-lang": "en_US",
      "x-li-page-instance": "urn:li:page:d_flagship3_job_tracker;applied",
      "x-li-track": '{"clientVersion":"1.13.0","mpVersion":"1.13.0","osName":"web","timezoneOffset":-6,"timezone":"America/Chicago","deviceFormFactor":"DESKTOP","mpName":"voyager-web"}',
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "application/vnd.linkedin.normalized+json+2.1",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.linkedin.com/jobs-tracker/?stage=applied",
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("LinkedIn session expired — please update LINKEDIN_SESSION_COOKIE in .env");
  }

  if (!response.ok) {
    let body = "";
    try { body = await response.text(); } catch { /* ignore */ }
    console.error("[LinkedIn] Error response body:", body.slice(0, 500));
    throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // LinkedIn wraps the real data in a "data" key for normalized responses
  const elements = data?.elements ?? data?.data?.elements ?? [];
  const paging = data?.paging ?? data?.data?.paging ?? { count, start, total: elements.length };

  return { elements, paging };
}

export async function fetchAllLinkedInApplications(): Promise<LinkedInApplication[]> {
  // LinkedIn's Voyager API is no longer reliably accessible.
  // Use the LinkedIn CSV import feature instead (Settings → Data privacy → Get a copy of your data → Job Applications).
  throw new Error("LinkedIn Voyager API is unavailable. Use the LinkedIn CSV import feature instead.");

  const liAt = process.env.LINKEDIN_SESSION_COOKIE;
  if (!liAt) {
    throw new Error("LINKEDIN_SESSION_COOKIE not set in .env");
  }

  const applications: LinkedInApplication[] = [];
  let start = 0;
  let total = Infinity;

  while (start < total) {
    const { elements, paging } = await fetchPage(liAt, start, PAGE_SIZE);
    total = paging.total;

    for (const element of elements) {
      const jobId = extractJobId(element);
      const company = extractCompanyName(element);
      const jobTitle = extractJobTitle(element);
      const dateApplied = extractDateApplied(element);
      const linkedinStatus = extractStatus(element);

      const jobUrl = jobId && jobId !== "0"
        ? `https://www.linkedin.com/jobs/view/${jobId}/`
        : null;

      applications.push({ company, jobTitle, dateApplied, jobUrl, linkedinStatus, linkedinJobId: jobId });
    }

    start += PAGE_SIZE;

    // Safety: stop if LinkedIn returns no elements
    if (elements.length === 0) break;
  }

  return applications;
}

export function isLinkedInConfigured(): boolean {
  return !!process.env.LINKEDIN_SESSION_COOKIE;
}
