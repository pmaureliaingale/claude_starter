import { Suspense } from "react";
import { requireSession } from "@/lib/session";
import { getApplications, getSummaryStats, getUniqueSources } from "@/lib/applications";
import { Nav } from "@/components/Nav";
import { SummaryBar } from "@/components/dashboard/SummaryBar";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { ApplicationList } from "@/components/dashboard/ApplicationList";
import { TokenExpiryAlert } from "@/components/TokenExpiryAlert";
import { isTokenExpired } from "@/lib/gmail/tokenStatus";
import type { Period } from "@/lib/applications";

interface PageProps {
  searchParams: Promise<{ period?: string; source?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  await requireSession();

  const params = await searchParams;
  const period = (params.period ?? "all") as Period;
  const source = params.source ?? "all";

  const [applications, stats, sources] = await Promise.all([
    getApplications({ period, source }),
    getSummaryStats(period),
    getUniqueSources(),
  ]);

  const tokenExpired = isTokenExpired();

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Track your job applications across all platforms
            </p>
          </div>

          {/* Gmail token expiry alert */}
          <TokenExpiryAlert show={tokenExpired} />

          {/* Summary statistics */}
          <SummaryBar stats={stats} />

          {/* Filters */}
          <Suspense>
            <FilterBar sources={sources} />
          </Suspense>

          {/* Application list */}
          <ApplicationList
            applications={applications}
            periodLabel={stats.periodLabel}
          />
        </div>
      </main>
    </div>
  );
}
