import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";
import { upsertJoinQrCode } from "./qr-seed";

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
    const qrCode = await upsertJoinQrCode(prisma);
    console.log("Join GiT QR code is ready:", {
      name: qrCode.name,
      slug: qrCode.slug,
      destinationPath: qrCode.destinationPath,
      isActive: qrCode.isActive,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Join GiT QR seeding failed:", error);
  process.exitCode = 1;
});
