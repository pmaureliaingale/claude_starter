"use client";

import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { RefreshCw, Save, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { sync_schedule, sync_log } from "@prisma/client";
import { formatDatetime } from "@/lib/utils";

const FREQUENCY_OPTIONS = [
  { value: 1, label: "Every hour" },
  { value: 2, label: "Every 2 hours" },
  { value: 3, label: "Every 3 hours" },
  { value: 6, label: "Every 6 hours" },
  { value: 12, label: "Every 12 hours" },
  { value: 24, label: "Once daily" },
];

const TIMEZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "UTC",
];

interface SyncSettingsFormProps {
  schedule: sync_schedule | null;
  lastLog: sync_log | null;
}

export function SyncSettingsForm({ schedule, lastLog }: SyncSettingsFormProps) {
  const [frequencyHrs, setFrequencyHrs] = useState(schedule?.frequency_hrs ?? 3);
  const [startTime, setStartTime] = useState(schedule?.start_time ?? "08:00");
  const [endTime, setEndTime] = useState(schedule?.end_time ?? "17:00");
  const [timezone, setTimezone] = useState(schedule?.timezone ?? "America/Chicago");
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/sync-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequency_hrs: frequencyHrs, start_time: startTime, end_time: endTime, timezone }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Sync schedule updated");
    } catch {
      toast.error("Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(`Sync failed: ${data.error ?? "Unknown error"}`);
      } else {
        const parts = [];
        if (data.linkedinApplications > 0) parts.push(`${data.linkedinApplications} from LinkedIn`);
        if (data.newApplications > 0) parts.push(`${data.newApplications} from Gmail`);
        if (data.newFollowUps > 0) parts.push(`${data.newFollowUps} follow-ups`);
        toast.success(parts.length > 0 ? `Sync complete — ${parts.join(", ")}` : "Sync complete — no new items");
      }
    } catch {
      toast.error("Sync failed — check your Gmail credentials");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sync Now */}
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-1">Manual Sync</h2>
        <p className="text-sm text-slate-400 mb-4">
          Trigger an immediate Gmail sync to pull in new applications and follow-ups.
        </p>
        <button
          onClick={handleSyncNow}
          disabled={isSyncing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Sync Now"}
        </button>
      </GlassCard>

      {/* Last sync status */}
      {lastLog && (
        <GlassCard className="p-5">
          <h2 className="text-base font-semibold text-white mb-3">Last Sync</h2>
          <div className="flex items-start gap-3">
            {lastLog.status === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-sm text-slate-300">
                {lastLog.status === "success" ? "Succeeded" : "Failed"} at{" "}
                {formatDatetime(lastLog.synced_at)}
              </p>
              {lastLog.status === "success" && (
                <p className="text-xs text-slate-500 mt-0.5">
                  +{lastLog.new_applications} applications, +{lastLog.new_follow_ups} follow-ups
                </p>
              )}
              {lastLog.error_message && (
                <p className="text-xs text-red-400 mt-1">{lastLog.error_message}</p>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Schedule settings */}
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-4">Auto-Sync Schedule</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Frequency */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Frequency</label>
            <select
              value={frequencyHrs}
              onChange={(e) => setFrequencyHrs(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz} className="bg-slate-900">
                  {tz}
                </option>
              ))}
            </select>
          </div>

          {/* Start time */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* End time */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Schedule"}
        </button>
      </GlassCard>
    </div>
  );
}
