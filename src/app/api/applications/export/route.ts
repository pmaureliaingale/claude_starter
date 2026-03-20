import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getApplications } from "@/lib/applications";
import { formatDate } from "@/lib/utils";
import type { Period } from "@/lib/applications";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source") ?? undefined;
  const period = (searchParams.get("period") ?? "month") as Period;

  const applications = await getApplications({ source, period });

  const headers = ["Company", "Job Title", "Date Applied", "Source"];
  const rows = applications.map((app) => [
    `"${app.company.replace(/"/g, '""')}"`,
    `"${app.job_title.replace(/"/g, '""')}"`,
    formatDate(app.date_applied),
    app.source,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="applications-${period}.csv"`,
    },
  });
}
