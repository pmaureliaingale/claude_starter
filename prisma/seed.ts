import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const existingAdmin = await prisma.user.findUnique({
    where: { username: "pablo" },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("changeme", 12);
    await prisma.user.create({
      data: {
        username: "pablo",
        email: "pmaureliajobs@gmail.com",
        password_hash: passwordHash,
        role: "admin",
      },
    });
    console.log("Created admin user: pablo (password: changeme)");
    console.log("IMPORTANT: Change this password after first login!");
  } else {
    console.log("Admin user already exists, skipping.");
  }

  // Create default sync schedule
  const existingSchedule = await prisma.sync_schedule.findFirst();
  if (!existingSchedule) {
    await prisma.sync_schedule.create({
      data: {
        frequency_hrs: 3,
        start_time: "08:00",
        end_time: "17:00",
        timezone: "America/Chicago",
      },
    });
    console.log("Created default sync schedule.");
  } else {
    console.log("Sync schedule already exists, skipping.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
