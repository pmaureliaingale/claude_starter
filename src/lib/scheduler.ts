import cron from "node-cron";
import { runGmailSync } from "./gmail/sync";
import { prisma } from "./prisma";

let scheduledTask: cron.ScheduledTask | null = null;
let schedulerStarted = false;

function buildCronExpression(frequencyHrs: number, startTime: string, endTime: string): string {
  const [startHour] = startTime.split(":").map(Number);
  const [endHour] = endTime.split(":").map(Number);

  // Run at minute 0 of every Nth hour, within the window
  // e.g. every 3 hours, 8-17: "0 8,11,14,17 * * *"
  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h += frequencyHrs) {
    hours.push(h);
  }

  return `0 ${hours.join(",")} * * *`;
}

async function scheduleFromDatabase(): Promise<void> {
  try {
    const schedule = await prisma.sync_schedule.findFirst();
    if (!schedule) return;

    const cronExpr = buildCronExpression(
      schedule.frequency_hrs,
      schedule.start_time,
      schedule.end_time
    );

    // Cancel existing task if any
    if (scheduledTask) {
      scheduledTask.stop();
      scheduledTask = null;
    }

    scheduledTask = cron.schedule(
      cronExpr,
      async () => {
        // Re-read schedule from DB each tick to pick up changes
        const currentSchedule = await prisma.sync_schedule.findFirst();
        if (currentSchedule) {
          const currentCron = buildCronExpression(
            currentSchedule.frequency_hrs,
            currentSchedule.start_time,
            currentSchedule.end_time
          );
          // If schedule changed, reschedule
          if (currentCron !== cronExpr) {
            await scheduleFromDatabase();
            return;
          }
        }

        console.log("[Scheduler] Running scheduled Gmail sync...");
        const result = await runGmailSync();
        console.log(
          `[Scheduler] Sync complete: ${result.status}, +${result.newApplications} apps, +${result.newFollowUps} follow-ups`
        );
      },
      {
        timezone: schedule.timezone,
      }
    );

    console.log(`[Scheduler] Gmail sync scheduled: ${cronExpr} (${schedule.timezone})`);
  } catch (err) {
    console.error("[Scheduler] Failed to schedule sync:", err);
  }
}

export function startScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  console.log("[Scheduler] Starting Gmail sync scheduler...");
  scheduleFromDatabase();
}
