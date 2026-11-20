import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";
import { upsertDefaultQrCode } from "./qr-seed";

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
    await upsertDefaultQrCode(prisma);
    console.log("The Main QR code was upserted; no records were deleted.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Default QR seeding failed:", error);
  process.exitCode = 1;
});
