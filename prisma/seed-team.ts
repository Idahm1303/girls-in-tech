import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";
import { upsertTeamRoster } from "./team-seed";

loadEnvConfig(process.cwd());

const directDatabaseUrl = process.env.DATABASE_URL_UNPOOLED;
if (
  !directDatabaseUrl ||
  !/^postgres(?:ql)?:\/\//i.test(directDatabaseUrl)
) {
  throw new Error(
    "Set DATABASE_URL_UNPOOLED to a direct PostgreSQL connection string.",
  );
}

const prisma = new PrismaClient({ datasourceUrl: directDatabaseUrl });

async function main() {
  try {
    await upsertTeamRoster(prisma);
    console.log("Team roster and photo paths were upserted; no records were deleted.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Team roster seeding failed:", error);
  process.exitCode = 1;
});
