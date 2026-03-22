"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { SourceBadge } from "@/components/SourceBadge";
import { GlassCard } from "@/components/GlassCard";
import { ApplicationModal } from "@/components/dashboard/ApplicationModal";
import { LocalDate } from "@/components/LocalDate";
import { MessageSquare, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import type { job_application, follow_up } from "@prisma/client";

export type ApplicationWithFollowUps = job_application & {
  follow_ups: follow_up[];
};

interface ApplicationListProps {
  applications: ApplicationWithFollowUps[];
  periodLabel: string;
  total: number;
  page: number;
  pageSize: number;
}

export function ApplicationList({ applications, periodLabel, total, page, pageSize }: ApplicationListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<ApplicationWithFollowUps | null>(null);
  const [localApplications, setLocalApplications] = useState(applications);

  useEffect(() => {
    setLocalApplications(applications);
    setSelected(null);
  }, [applications]);

  const totalPages = Math.ceil(total / pageSize);

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`);
  }

  const handleStatusUpdate = (id: string, newStatus: string) => {
    setLocalApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
    if (selected?.id === id) {
      setSelected((prev) => (prev ? { ...prev, status: newStatus } : prev));
    }
  };

  if (localApplications.length === 0) {
    return (
      <GlassCard className="p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-slate-500" />
        </div>
        <p className="text-slate-400 font-medium">
          No Applications {periodLabel === "Today" ? "Today" : `for ${periodLabel}`}
        </p>
        <p className="text-slate-500 text-sm mt-1">
          Applications will appear here once synced from Gmail or added manually.
        </p>
      </GlassCard>
    );
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <>
      <GlassCard className="overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[3fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-white/10">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Application</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Date Applied</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Source</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          {localApplications.map((app) => (
            <button
              key={app.id}
              onClick={() => setSelected(app)}
              className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors group"
            >
              {/* Mobile layout */}
              <div className="sm:hidden flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                      {app.company}
                      <span className="text-slate-400 font-normal"> · {app.job_title}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <SourceBadge source={app.source} />
                      <LocalDate date={app.date_applied} className="text-xs text-slate-500" />
                    </div>
                  </div>
                  {app.follow_ups.length > 0 && (
                    <span className="text-xs text-purple-400 flex items-center gap-1 shrink-0">
                      <MessageSquare className="w-3 h-3" />
                      {app.follow_ups.length}
                    </span>
                  )}
                </div>
                <StatusBadge status={app.status} />
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:grid grid-cols-[3fr_1fr_1fr_1fr] gap-4 items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="min-w-0">
                    <span className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                      {app.company}
                    </span>
                    <span className="text-sm text-slate-400 ml-1.5">· {app.job_title}</span>
                  </div>
                  {app.follow_ups.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-purple-400 shrink-0">
                      <MessageSquare className="w-3 h-3" />
                      {app.follow_ups.length}
                    </span>
                  )}
                  {app.job_url && (
                    <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                  )}
                </div>
                <LocalDate date={app.date_applied} className="text-sm text-slate-400" />
                <SourceBadge source={app.source} />
                <StatusBadge status={app.status} />
              </div>
            </button>
          ))}
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
            <span className="text-xs text-slate-500">
              {start}–{end} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "…" ? (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-500 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p as number)}
                      className={`min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? "bg-purple-600 text-white"
                          : "text-slate-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {selected && (
        <ApplicationModal
          application={selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </>
  );
}
