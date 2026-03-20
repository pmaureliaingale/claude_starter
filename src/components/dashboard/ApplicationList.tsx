"use client";

import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { SourceBadge } from "@/components/SourceBadge";
import { GlassCard } from "@/components/GlassCard";
import { ApplicationModal } from "@/components/dashboard/ApplicationModal";
import { formatDate } from "@/lib/utils";
import { MessageSquare, ExternalLink } from "lucide-react";
import type { job_application, follow_up } from "@prisma/client";

export type ApplicationWithFollowUps = job_application & {
  follow_ups: follow_up[];
};

interface ApplicationListProps {
  applications: ApplicationWithFollowUps[];
  periodLabel: string;
}

export function ApplicationList({ applications, periodLabel }: ApplicationListProps) {
  const [selected, setSelected] = useState<ApplicationWithFollowUps | null>(null);
  const [localApplications, setLocalApplications] = useState(applications);

  useEffect(() => {
    setLocalApplications(applications);
    setSelected(null);
  }, [applications]);

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

  return (
    <>
      <GlassCard className="overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-white/10">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Company</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Job Title</span>
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
              <div className="sm:hidden space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                      {app.company}
                    </p>
                    <p className="text-sm text-slate-400">{app.job_title}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <SourceBadge source={app.source} />
                  <span className="text-xs text-slate-500">{formatDate(app.date_applied)}</span>
                  {app.follow_ups.length > 0 && (
                    <span className="text-xs text-purple-400 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {app.follow_ups.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                    {app.company}
                  </span>
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
                <span className="text-sm text-slate-300 truncate">{app.job_title}</span>
                <span className="text-sm text-slate-400">{formatDate(app.date_applied)}</span>
                <SourceBadge source={app.source} />
                <StatusBadge status={app.status} />
              </div>
            </button>
          ))}
        </div>
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
