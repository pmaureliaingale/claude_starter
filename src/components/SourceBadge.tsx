import { cn } from "@/lib/utils";

const sourceConfig: Record<string, { label: string; className: string }> = {
  linkedin: {
    label: "LinkedIn",
    className: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  },
  gmail: {
    label: "Gmail",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  builtin: {
    label: "Built In",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  monster: {
    label: "Monster",
    className: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  },
  indeed: {
    label: "Indeed",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  hired: {
    label: "Hired",
    className: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  },
};

interface SourceBadgeProps {
  source: string;
  className?: string;
}

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const config = sourceConfig[source.toLowerCase()] ?? {
    label: source.charAt(0).toUpperCase() + source.slice(1),
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
