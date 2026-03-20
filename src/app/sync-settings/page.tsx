import { requireSession } from "@/lib/session";
import { Nav } from "@/components/Nav";
import { SyncSettingsForm } from "@/components/sync/SyncSettingsForm";
import { LinkedInImportCard } from "@/components/sync/LinkedInImportCard";
import { prisma } from "@/lib/prisma";

export default async function SyncSettingsPage() {
  await requireSession();

  const [schedule, lastLog] = await Promise.all([
    prisma.sync_schedule.findFirst(),
    prisma.sync_log.findFirst({ orderBy: { synced_at: "desc" } }),
  ]);

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Sync Settings</h1>
            <p className="text-slate-400 text-sm mt-1">
              Configure how often Gmail is checked for new applications and follow-ups
            </p>
          </div>

          <SyncSettingsForm schedule={schedule} lastLog={lastLog} />
          <LinkedInImportCard />
        </div>
      </main>
    </div>
  );
}
