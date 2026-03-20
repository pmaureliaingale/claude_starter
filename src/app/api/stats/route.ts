import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSummaryStats } from "@/lib/applications";
import type { Period } from "@/lib/applications";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") ?? "month") as Period;

  const stats = await getSummaryStats(period);
  return NextResponse.json(stats);
}
