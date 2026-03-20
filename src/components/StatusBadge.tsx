import { cn } from "@/lib/utils";

type Status =
  | "applied"
  | "responded"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn"
  | "manual_review";

const statusConfig: Record<Status, { label: string; className: string }> = {
  applied: {
    label: "Applied",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  responded: {
    label: "Responded",
    className: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
  interviewing: {
    label: "Interviewing",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  offer: {
    label: "Offer",
    className: "bg-green-500/15 text-green-400 border-green-500/30",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  withdrawn: {
    label: "Withdrawn",
    className: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  },
  manual_review: {
    label: "Manual Review",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as Status] ?? {
    label: status,
    className: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export const ALL_STATUSES: Status[] = [
  "applied",
  "responded",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
  "manual_review",
];
