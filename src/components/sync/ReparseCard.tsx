"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ReparseResult {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

export function ReparseCard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReparseResult | null>(null);

  const handleReparse = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/reparse", { method: "POST" });
      if (!res.ok) {
        toast.error("Re-parse failed");
        return;
      }
      const data: ReparseResult = await res.json();
      setResult(data);
      toast.success(`Updated ${data.updated} of ${data.total} applications`);
    } catch {
      toast.error("Re-parse failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white">Re-parse Job Titles &amp; Companies</h2>
        <p className="text-slate-400 text-sm mt-1">
          Re-reads your Gmail import emails and applies improved extraction logic to existing records.
          Only updates fields that were previously missing or incorrect.
        </p>
      </div>

      <button
        onClick={handleReparse}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Re-parsing…" : "Run Re-parse"}
      </button>

      {result && (
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { label: "Total", value: result.total },
            { label: "Updated", value: result.updated, highlight: true },
            { label: "Skipped", value: result.skipped },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="bg-white/5 rounded-xl px-4 py-3 text-center">
              <div className={`text-xl font-bold ${highlight ? "text-purple-400" : "text-white"}`}>
                {value}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {result && result.errors > 0 && (
        <p className="text-xs text-amber-400">
          {result.errors} email{result.errors !== 1 ? "s" : ""} could not be fetched from Gmail.
        </p>
      )}
    </div>
  );
}
