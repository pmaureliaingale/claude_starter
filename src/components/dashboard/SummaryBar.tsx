import { GlassCard } from "@/components/GlassCard";
import { StatusBadge, ALL_STATUSES } from "@/components/StatusBadge";
import type { SummaryStats } from "@/lib/applications";
import { TrendingUp, Briefcase, CheckCircle2 } from "lucide-react";

interface SummaryBarProps {
  stats: SummaryStats;
}

export function SummaryBar({ stats }: SummaryBarProps) {
  return (
    <div className="space-y-4">
      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Applications</p>
              <p className="text-2xl font-bold text-white animate-count-up">
                {stats.total}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Response Rate</p>
              <p className="text-2xl font-bold text-white animate-count-up">
                {stats.responseRate}%
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Active</p>
              <p className="text-2xl font-bold text-white animate-count-up">
                {(stats.byStatus["interviewing"] ?? 0) + (stats.byStatus["responded"] ?? 0)}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Status breakdown */}
      <GlassCard className="p-4">
        <p className="text-xs text-slate-400 font-medium mb-3">Status Breakdown — {stats.periodLabel}</p>
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((status) => {
            const count = stats.byStatus[status] ?? 0;
            return (
              <div key={status} className="flex items-center gap-1.5">
                <StatusBadge status={status} />
                <span className="text-sm font-semibold text-slate-300">{count}</span>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
