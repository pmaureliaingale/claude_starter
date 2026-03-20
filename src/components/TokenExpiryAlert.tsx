"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface TokenExpiryAlertProps {
  show: boolean;
}

export function TokenExpiryAlert({ show }: TokenExpiryAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!show || dismissed) return null;

  return (
    <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-yellow-300">Gmail Authentication Expired</p>
        <p className="text-xs text-yellow-400/80 mt-0.5">
          Your Gmail OAuth token has expired. Please update your{" "}
          <code className="bg-yellow-500/20 px-1 rounded">.env</code> with a new{" "}
          <code className="bg-yellow-500/20 px-1 rounded">GMAIL_REFRESH_TOKEN</code> and restart the server.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-yellow-400/60 hover:text-yellow-400 transition-colors text-xs shrink-0"
      >
        Dismiss
      </button>
    </div>
  );
}
