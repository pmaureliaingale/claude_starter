import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runGmailSync } from "@/lib/gmail/sync";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await runGmailSync();
  return NextResponse.json(result, { status: result.status === "failed" ? 500 : 200 });
}
