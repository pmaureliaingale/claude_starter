"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, ChevronDown, ChevronUp, Mail, Calendar, Inbox } from "lucide-react";
import { StatusBadge, ALL_STATUSES } from "@/components/StatusBadge";
import { SourceBadge } from "@/components/SourceBadge";
import { LocalDate } from "@/components/LocalDate";
import { toast } from "sonner";
import type { ApplicationWithFollowUps } from "./ApplicationList";

interface ApplicationModalProps {
  application: ApplicationWithFollowUps;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string) => void;
}

interface EmailData {
  body: string | null;
  subject?: string;
  from?: string;
  date?: string;
  reason?: string;
}

export function ApplicationModal({ application, onClose, onStatusUpdate }: ApplicationModalProps) {
  const [expandedFollowUp, setExpandedFollowUp] = useState<string | null>(null);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setEmailExpanded(false);
    setEmailData(null);
  }, [application.id]);

  async function loadEmail() {
    if (emailData !== null) {
      setEmailExpanded((v) => !v);
      return;
    }
    setEmailExpanded(true);
    setEmailLoading(true);
    try {
      const res = await fetch(`/api/applications/${application.id}/email`);
      const data = await res.json();
      setEmailData(data);
    } catch {
      setEmailData({ body: null, reason: "fetch_failed" });
    } finally {
      setEmailLoading(false);
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      onStatusUpdate(application.id, newStatus);
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const hasGmailId = !!application.gmail_message_id;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg z-50 flex flex-col animate-slide-in-right">
        <div className="flex-1 backdrop-blur-xl bg-slate-900/95 border-l border-white/10 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 backdrop-blur-md bg-slate-900/80 border-b border-white/10 px-6 py-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white truncate">{application.company}</h2>
              <p className="text-sm text-slate-400 truncate">{application.job_title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Source</p>
                <SourceBadge source={application.source} />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Date Applied</p>
                <p className="text-sm text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <LocalDate date={application.date_applied} />
                </p>
              </div>
              {application.job_url && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-1">Job Posting</p>
                  <a
                    href={application.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Job Posting
                  </a>
                </div>
              )}
            </div>

            {/* Status update */}
            <div>
              <p className="text-xs text-slate-500 mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={isUpdating || application.status === status}
                    className={`transition-all duration-200 ${
                      application.status === status
                        ? "opacity-100 scale-105 ring-2 ring-purple-500/50"
                        : "opacity-60 hover:opacity-100"
                    } disabled:cursor-not-allowed`}
                  >
                    <StatusBadge status={status} />
                  </button>
                ))}
              </div>
            </div>

            {/* Original email */}
            <div>
              <button
                onClick={hasGmailId ? loadEmail : undefined}
                disabled={!hasGmailId}
                className={`w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  hasGmailId
                    ? "bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer"
                    : "bg-white/[0.02] border-white/5 cursor-default"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-sm font-semibold text-white">Original Email</span>
                  {!hasGmailId && (
                    <span className="text-xs text-slate-500">(not from Gmail)</span>
                  )}
                </div>
                {hasGmailId && (
                  emailExpanded
                    ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {emailExpanded && (
                <div className="mt-2 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                  {emailLoading ? (
                    <div className="px-4 py-6 text-center">
                      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Loading email...</p>
                    </div>
                  ) : emailData?.body ? (
                    <>
                      {emailData.subject && (
                        <div className="px-4 py-3 border-b border-white/10 space-y-1">
                          <p className="text-xs text-slate-500">
                            <span className="font-medium text-slate-400">From:</span> {emailData.from}
                          </p>
                          <p className="text-xs text-slate-500">
                            <span className="font-medium text-slate-400">Subject:</span> {emailData.subject}
                          </p>
                          <p className="text-xs text-slate-500">
                            <span className="font-medium text-slate-400">Date:</span> {emailData.date}
                          </p>
                        </div>
                      )}
                      <div className="px-4 py-4 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                        {emailData.body}
                      </div>
                    </>
                  ) : (
                    <div className="px-4 py-5 text-center">
                      <p className="text-sm text-slate-500">
                        {emailData?.reason === "fetch_failed"
                          ? "Could not load email — check Gmail connection"
                          : "No email body available"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Follow-ups */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-white">
                  Follow-ups{" "}
                  <span className="text-slate-400 font-normal">
                    ({application.follow_ups.length})
                  </span>
                </h3>
              </div>

              {application.follow_ups.length === 0 ? (
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                  <p className="text-sm text-slate-500">No follow-up emails yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {application.follow_ups.map((followUp) => (
                    <div
                      key={followUp.id}
                      className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedFollowUp(
                            expandedFollowUp === followUp.id ? null : followUp.id
                          )
                        }
                        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {followUp.email_subject}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            <LocalDate date={followUp.received_at} showTime />
                          </p>
                        </div>
                        {expandedFollowUp === followUp.id ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                      </button>

                      {expandedFollowUp === followUp.id && (
                        <div className="px-4 pb-4 border-t border-white/10">
                          <div className="mt-3 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                            {followUp.email_body}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
