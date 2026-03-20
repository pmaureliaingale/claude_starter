"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PERIODS = [
  { value: "all", label: "All" },
  { value: "day", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const;

interface FilterBarProps {
  sources: string[];
}

export function FilterBar({ sources }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = searchParams.get("period") ?? "all";
  const currentSource = searchParams.get("source") ?? "all";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleExport = async () => {
    const params = new URLSearchParams(searchParams.toString());
    const response = await fetch(`/api/applications/export?${params.toString()}`);
    if (!response.ok) {
      toast.error("Failed to export CSV");
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications-${currentPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Period toggle */}
        <div className="flex items-center gap-1 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-1">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateParam("period", value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                currentPeriod === value
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Source filter */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-1">
          <select
            value={currentSource}
            onChange={(e) => updateParam("source", e.target.value)}
            className="bg-transparent text-sm text-slate-300 px-2 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900">All Sources</option>
            {sources.map((s) => (
              <option key={s} value={s} className="bg-slate-900 capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Export */}
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
      >
        <Download className="w-4 h-4" />
        Export CSV
      </button>
    </div>
  );
}
