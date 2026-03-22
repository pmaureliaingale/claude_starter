"use client";

import { useEffect, useState } from "react";

function fmt(date: string | Date, showTime: boolean, timeZone?: string): string {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(showTime ? { hour: "numeric", minute: "2-digit" } : {}),
    ...(timeZone ? { timeZone } : {}),
  };
  return new Intl.DateTimeFormat("en-US", options).format(new Date(date));
}

interface LocalDateProps {
  date: string | Date;
  showTime?: boolean;
  className?: string;
}

/**
 * Renders a date in the user's local timezone.
 * Starts with UTC on the server to avoid hydration mismatches,
 * then switches to local time after mount.
 */
export function LocalDate({ date, showTime = false, className }: LocalDateProps) {
  const [formatted, setFormatted] = useState(() => fmt(date, showTime, "UTC"));

  useEffect(() => {
    setFormatted(fmt(date, showTime));
  }, [date, showTime]);

  return (
    <span suppressHydrationWarning className={className}>
      {formatted}
    </span>
  );
}
