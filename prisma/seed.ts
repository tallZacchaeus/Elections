import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Clean seed: provisions only the staff (admin + observer) accounts.
// No demo elections, positions, candidates or voters are created — elections
// are built entirely through the admin UI (Admin → Elections → create).
//
// This script is non-destructive: it never deletes existing data, so it is
// safe to run against a live database.

async function main() {
  console.log("→ Admin & observer accounts…");
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@oyscatech.edu.ng";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe!Admin2026";
  const observerEmail = process.env.OBSERVER_EMAIL ?? "observer@oyscatech.edu.ng";
  const observerPassword = process.env.OBSERVER_PASSWORD ?? "ChangeMe!Observer2026";

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash: await bcrypt.hash(adminPassword, 10), role: "ADMIN" },
    create: {
      email: adminEmail,
      name: "Electoral Officer",
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    },
  });
  await prisma.adminUser.upsert({
    where: { email: observerEmail },
    update: { passwordHash: await bcrypt.hash(observerPassword, 10), role: "OBSERVER" },
    create: {
      email: observerEmail,
      name: "Accredited Observer",
      passwordHash: await bcrypt.hash(observerPassword, 10),
      role: "OBSERVER",
    },
  });

  console.log("✔ Seed complete.");
  console.log(`   Admin:    ${adminEmail}`);
  console.log(`   Observer: ${observerEmail}`);
  console.log("   Next: sign in to /admin → Elections → create your first election.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
