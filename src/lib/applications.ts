import { prisma } from "@/lib/prisma";

export type Period = "all" | "day" | "week" | "month" | "year";

function getPeriodDateRange(period: Period): { from: Date; to: Date } | null {
  if (period === "all") return null;

  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  if (period === "week") {
    from.setDate(from.getDate() - 6);
  } else if (period === "month") {
    from.setDate(1);
  } else if (period === "year") {
    from.setMonth(0, 1);
  }

  return { from, to };
}

export interface ApplicationFilters {
  source?: string;
  period?: Period;
  dateFrom?: Date;
  dateTo?: Date;
}

export async function getApplications(filters: ApplicationFilters = {}) {
  const { source, period } = filters;
  let { dateFrom, dateTo } = filters;

  if (period && period !== "all") {
    const range = getPeriodDateRange(period);
    if (range) {
      dateFrom = range.from;
      dateTo = range.to;
    }
  }

  return prisma.job_application.findMany({
    where: {
      ...(source && source !== "all" ? { source } : {}),
      ...(dateFrom || dateTo
        ? {
            date_applied: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    },
    include: {
      follow_ups: {
        orderBy: { received_at: "asc" },
      },
    },
    orderBy: { date_applied: "desc" },
  });
}

export async function getApplicationById(id: string) {
  return prisma.job_application.findUnique({
    where: { id },
    include: {
      follow_ups: {
        orderBy: { received_at: "asc" },
      },
    },
  });
}

export interface SummaryStats {
  total: number;
  responseRate: number;
  byStatus: Record<string, number>;
  periodLabel: string;
}

export async function getSummaryStats(period: Period = "all"): Promise<SummaryStats> {
  const range = getPeriodDateRange(period);

  const applications = await prisma.job_application.findMany({
    where: {
      ...(range ? { date_applied: { gte: range.from, lte: range.to } } : {}),
    },
    include: {
      follow_ups: { select: { id: true } },
    },
  });

  const total = applications.length;

  // Response rate: companies with ≥1 follow-up / total companies × 100
  const companiesTotal = new Set(applications.map((a) => a.company.toLowerCase())).size;
  const companiesWithFollowUp = new Set(
    applications
      .filter((a) => a.follow_ups.length > 0)
      .map((a) => a.company.toLowerCase())
  ).size;

  const responseRate =
    companiesTotal === 0
      ? 0
      : Math.round((companiesWithFollowUp / companiesTotal) * 100);

  const byStatus = applications.reduce<Record<string, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] ?? 0) + 1;
    return acc;
  }, {});

  const periodLabels: Record<Period, string> = {
    all: "All Time",
    day: "Today",
    week: "This Week",
    month: "This Month",
    year: "This Year",
  };

  return { total, responseRate, byStatus, periodLabel: periodLabels[period] };
}

export async function getUniqueSources(): Promise<string[]> {
  const results = await prisma.job_application.findMany({
    select: { source: true },
    distinct: ["source"],
    orderBy: { source: "asc" },
  });
  return results.map((r) => r.source);
}
