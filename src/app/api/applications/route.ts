import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getApplications } from "@/lib/applications";
import type { Period } from "@/lib/applications";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source") ?? undefined;
  const period = (searchParams.get("period") ?? "month") as Period;

  const applications = await getApplications({ source, period });
  return NextResponse.json(applications);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { company, job_title, date_applied, source, status, job_url } = body;

  if (!company || !job_title || !date_applied || !source) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const application = await prisma.job_application.create({
    data: {
      company,
      job_title,
      date_applied: new Date(date_applied),
      source,
      status: status ?? "applied",
      job_url: job_url ?? null,
    },
  });

  return NextResponse.json(application, { status: 201 });
}
