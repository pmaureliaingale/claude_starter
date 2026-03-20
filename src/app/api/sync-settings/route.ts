import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schedule = await prisma.sync_schedule.findFirst();
  return NextResponse.json(schedule);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { frequency_hrs, start_time, end_time, timezone } = body;

  const existing = await prisma.sync_schedule.findFirst();

  let schedule;
  if (existing) {
    schedule = await prisma.sync_schedule.update({
      where: { id: existing.id },
      data: {
        ...(frequency_hrs !== undefined ? { frequency_hrs: Number(frequency_hrs) } : {}),
        ...(start_time !== undefined ? { start_time } : {}),
        ...(end_time !== undefined ? { end_time } : {}),
        ...(timezone !== undefined ? { timezone } : {}),
      },
    });
  } else {
    schedule = await prisma.sync_schedule.create({
      data: {
        frequency_hrs: frequency_hrs ?? 3,
        start_time: start_time ?? "08:00",
        end_time: end_time ?? "17:00",
        timezone: timezone ?? "America/Chicago",
      },
    });
  }

  return NextResponse.json(schedule);
}
