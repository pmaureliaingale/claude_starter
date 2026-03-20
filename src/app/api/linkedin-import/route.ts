import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// LinkedIn exported CSV columns:
// Application Date, Company Name, Job Title, Status
interface LinkedInRow {
  "Application Date": string;
  "Company Name": string;
  "Job Title": string;
  Status: string;
}

const STATUS_MAP: Record<string, string> = {
  applied: "applied",
  "in progress": "interviewing",
  "offer extended": "offer",
  rejected: "rejected",
  withdrawn: "withdrawn",
  "application viewed": "applied",
  "under consideration": "responded",
};

function parseLinkedInStatus(raw: string): string {
  const normalized = raw.trim().toLowerCase();
  return STATUS_MAP[normalized] ?? "applied";
}

function parseCSV(text: string): LinkedInRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: LinkedInRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Handle quoted fields containing commas
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });

    rows.push(row as unknown as LinkedInRow);
  }

  return rows;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "File must be a CSV" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: "No data rows found in CSV" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      const company = row["Company Name"]?.trim();
      const jobTitle = row["Job Title"]?.trim();
      const dateStr = row["Application Date"]?.trim();
      const status = parseLinkedInStatus(row["Status"] ?? "");

      if (!company || !jobTitle || !dateStr) {
        skipped++;
        continue;
      }

      const dateApplied = new Date(dateStr);
      if (isNaN(dateApplied.getTime())) {
        skipped++;
        continue;
      }

      // Deduplicate: same company + title + date (within ±1 day) from linkedin source
      const existing = await prisma.job_application.findFirst({
        where: {
          company,
          job_title: jobTitle,
          source: "linkedin",
          date_applied: {
            gte: new Date(dateApplied.getTime() - 86400000),
            lte: new Date(dateApplied.getTime() + 86400000),
          },
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.job_application.create({
        data: {
          company,
          job_title: jobTitle,
          date_applied: dateApplied,
          source: "linkedin",
          status,
        },
      });

      imported++;
    }

    return NextResponse.json({ imported, skipped, total: rows.length });
  } catch (err) {
    console.error("[LinkedIn Import]", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
